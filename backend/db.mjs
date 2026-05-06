// db.mjs
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dir, 'shop.db'))

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS mechanics (
                                         mechanic_id INTEGER PRIMARY KEY,
                                         name_txt    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS customers (
                                         customer_id  INTEGER PRIMARY KEY,
                                         name_txt     TEXT NOT NULL,
                                         insurance_id INTEGER DEFAULT 0,
                                         payments_due REAL    DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS vehicles (
                                        vehicle_id      INTEGER PRIMARY KEY AUTOINCREMENT,
                                        customer_id     INTEGER REFERENCES customers(customer_id),
    year_num        INTEGER,
    make_txt        TEXT,
    model_txt       TEXT,
    plate_txt       TEXT,
    status_txt      TEXT DEFAULT 'No Active Service',
    issue_txt       TEXT DEFAULT 'None',
    appointment_txt TEXT DEFAULT 'No appointment scheduled'
    );
  CREATE TABLE IF NOT EXISTS jobs (
                                    job_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                                    title_txt    TEXT NOT NULL,
                                    customer_nm  TEXT,
                                    vehicle_txt  TEXT,
                                    vehicle_id   INTEGER REFERENCES vehicles(vehicle_id),
    mechanic_id  INTEGER REFERENCES mechanics(mechanic_id),
    status_txt   TEXT DEFAULT 'pending',
    priority_txt TEXT DEFAULT 'medium',
    diag_code    TEXT DEFAULT 'new_ticket',
    diag_note    TEXT DEFAULT '',
    diag_at      TEXT,
    est_cost     REAL DEFAULT 0,
    quote_at     TEXT,
    updated_at   TEXT,
    completed_at TEXT
    );
  CREATE TABLE IF NOT EXISTS cost_pings (
                                          ping_id     INTEGER PRIMARY KEY AUTOINCREMENT,
                                          job_id      INTEGER REFERENCES jobs(job_id),
    customer_nm TEXT,
    vehicle_txt TEXT,
    amount_num  REAL,
    made_at     TEXT,
    paid_at     TEXT
    );
  CREATE TABLE IF NOT EXISTS service_requests (
                                                req_id      INTEGER PRIMARY KEY AUTOINCREMENT,
                                                customer_id INTEGER REFERENCES customers(customer_id),
    customer_nm TEXT,
    vehicle_id  INTEGER REFERENCES vehicles(vehicle_id),
    vehicle_txt TEXT,
    issue_txt   TEXT,
    status_txt  TEXT DEFAULT 'pending',
    est_cost    REAL DEFAULT 0,
    made_at     TEXT
    );
`)

try {
  db.exec(`ALTER TABLE service_requests ADD COLUMN vehicle_id INTEGER REFERENCES vehicles(vehicle_id)`)
} catch (e) {
  // Column already exists.
}

const backfillServiceRequestVehicleIds = db.transaction(() => {
  const reqs = db.prepare('SELECT req_id, customer_id, vehicle_txt FROM service_requests WHERE vehicle_id IS NULL').all()
  const findVehicle = db.prepare(
    "SELECT vehicle_id FROM vehicles WHERE customer_id = ? AND ? LIKE year_num || '% ' || make_txt || ' ' || model_txt || '%' ORDER BY vehicle_id LIMIT 1"
  )
  const updateReq = db.prepare('UPDATE service_requests SET vehicle_id = ? WHERE req_id = ?')
  for (const req of reqs) {
    if (!req.customer_id || !req.vehicle_txt) continue
    const match = findVehicle.get(req.customer_id, req.vehicle_txt)
    if (match?.vehicle_id) {
      updateReq.run(match.vehicle_id, req.req_id)
    }
  }
})

backfillServiceRequestVehicleIds()

// Add paid_at column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE cost_pings ADD COLUMN paid_at TEXT`)
} catch (e) {
  // Column already exists, ignore
}

const seed = db.transaction(() => {
  if (db.prepare('SELECT 1 FROM mechanics LIMIT 1').get()) return

  const ins_m = db.prepare('INSERT INTO mechanics (mechanic_id, name_txt) VALUES (?, ?)')
  ins_m.run(1, 'Maria Chen')
  ins_m.run(2, 'Jordan Patel')
  ins_m.run(3, 'Luis Romero')
  ins_m.run(4, 'Nina Brooks')

  const ins_c = db.prepare(
    'INSERT INTO customers (customer_id, name_txt, insurance_id, payments_due) VALUES (?, ?, ?, ?)'
  )
  ins_c.run(301, 'Olivia Carter', 910201, 0)
  ins_c.run(302, 'Ethan Walker', 910202, 0)
  ins_c.run(303, 'Sophia Nguyen', 910203, 0)
  ins_c.run(304, 'Mason Reed', 910204, 0)

  const ins_v = db.prepare('INSERT INTO vehicles (customer_id, year_num, make_txt, model_txt, plate_txt, status_txt, issue_txt, appointment_txt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  ins_v.run(301, 2022, 'Toyota', 'RAV4', '8TKR214', 'In Service', 'Brake vibration at highway speed', '2026-05-08 09:00 AM')
  ins_v.run(302, 2019, 'Honda', 'Accord', '7LPN553', 'Awaiting Parts', 'A/C blowing warm air', '2026-05-09 11:30 AM')
  ins_v.run(303, 2020, 'Ford', 'Escape', '9JQW102', 'Ready for Pickup', 'Battery drain overnight', '2026-05-06 03:15 PM')
  ins_v.run(304, 2017, 'Subaru', 'Outback', '6MZT448', 'No Active Service', 'None', 'No appointment scheduled')
  ins_v.run(301, 2016, 'Mazda', 'CX-5', '5BRD771', 'In Service', 'Check engine light intermittent', '2026-05-10 01:00 PM')

  const ins_j = db.prepare('INSERT INTO jobs (title_txt, customer_nm, vehicle_txt, vehicle_id, mechanic_id, status_txt, priority_txt, diag_code, est_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  ins_j.run('Front Brake Service', 'Olivia Carter', '2022 Toyota RAV4 (8TKR214)', 1, 1, 'in-progress', 'high', 'brake_system', 420.00)
  ins_j.run('A/C Compressor Diagnosis', 'Ethan Walker', '2019 Honda Accord (7LPN553)', 2, 2, 'assigned', 'medium', 'ac_cooling', 260.00)
  ins_j.run('Parasitic Draw Test', 'Sophia Nguyen', '2020 Ford Escape (9JQW102)', 3, 3, 'quoted', 'medium', 'electrical_draw', 185.00)
  ins_j.run('Emissions System Scan', 'Olivia Carter', '2016 Mazda CX-5 (5BRD771)', 5, 4, 'pending', 'medium', 'check_engine', 140.00)
  ins_j.run('Fleet Safety Inspection', 'BlueLine Delivery', '2021 Mercedes Sprinter', null, null, 'pending', 'low', 'inspection_pending', 0)
  ins_j.run('Oil Leak Confirmation', 'City Utilities', '2018 Chevy Silverado', null, 3, 'assigned', 'medium', 'oil_leak', 310.00)

  const ins_sr = db.prepare('INSERT INTO service_requests (customer_id, customer_nm, vehicle_id, vehicle_txt, issue_txt, status_txt, est_cost, made_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const now = new Date().toISOString()
  ins_sr.run(301, 'Olivia Carter', 1, '2022 Toyota RAV4', 'Brake vibration at highway speed', 'in-progress', 420.00, now)
  ins_sr.run(302, 'Ethan Walker', 2, '2019 Honda Accord', 'A/C blowing warm air', 'assigned', 260.00, now)
  ins_sr.run(303, 'Sophia Nguyen', 3, '2020 Ford Escape', 'Battery drain overnight', 'quoted', 185.00, now)
  ins_sr.run(301, 'Olivia Carter', 5, '2016 Mazda CX-5', 'Check engine light intermittent', 'pending', 140.00, now)

  const ins_ping = db.prepare(
    'INSERT INTO cost_pings (job_id, customer_nm, vehicle_txt, amount_num, made_at, paid_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  ins_ping.run(3, 'Sophia Nguyen', '2020 Ford Escape (9JQW102)', 185.00, now, null)
})

seed()

export { db }
