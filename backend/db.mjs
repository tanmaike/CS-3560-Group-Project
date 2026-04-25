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
    made_at     TEXT
  );
  CREATE TABLE IF NOT EXISTS service_requests (
    req_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(customer_id),
    customer_nm TEXT,
    vehicle_txt TEXT,
    issue_txt   TEXT,
    status_txt  TEXT DEFAULT 'pending',
    est_cost    REAL DEFAULT 0,
    made_at     TEXT
  );
`)

const seed = db.transaction(() => {
  if (db.prepare('SELECT 1 FROM mechanics LIMIT 1').get()) return

  const ins_m = db.prepare('INSERT INTO mechanics (mechanic_id, name_txt) VALUES (?, ?)')
  ins_m.run(1, 'Mike Thompson')
  ins_m.run(2, 'Alex')
  ins_m.run(3, 'Chris')
  ins_m.run(4, 'Taylor')

  db.prepare('INSERT INTO customers (customer_id, name_txt, insurance_id, payments_due) VALUES (301, ?, 900145, 249.99)').run('Anthony DiDio')

  const ins_v = db.prepare('INSERT INTO vehicles (customer_id, year_num, make_txt, model_txt, plate_txt, status_txt, issue_txt, appointment_txt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  ins_v.run(301, 2021, 'Toyota', 'Corolla', 'ABC-123', 'In Service',       'Brake inspection', '2026-04-12 10:00 AM')
  ins_v.run(301, 2018, 'Honda',  'Civic',   'XYZ-789', 'Ready for Pickup', 'Oil change',       '2026-04-09 2:30 PM')

  const ins_j = db.prepare('INSERT INTO jobs (title_txt, customer_nm, vehicle_txt, mechanic_id, status_txt, priority_txt, diag_code, est_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  ins_j.run('Oil Change',               'John Smith',    '2020 Toyota Camry',   1,    'pending',     'low',    'needs_oil_change', 49.99)
  ins_j.run('Brake Pad Replacement',    'Sarah Johnson', '2019 Honda CR-V',     1,    'in-progress', 'high',   'brake_issue',      299.99)
  ins_j.run('Engine Diagnostics',       'Robert Brown',  '2018 Ford F-150',     1,    'pending',     'medium', 'check_engine',     149.99)
  ins_j.run('Transmission Fluid Flush', 'Emily Davis',   '2021 Subaru Outback', 1,    'completed',   'low',    'maintenance_due',  189.99)
  ins_j.run('Check Engine Light',       'David Wilson',  '2017 BMW 3 Series',   1,    'pending',     'high',   'engine_issue',     399.99)
  ins_j.run('General Inspection',       'John Doe',      'Vehicle #5001',       null, 'pending',     'medium', 'pending_diag',     0)
  ins_j.run('Oil Leak Repair',          'Jane Smith',    'Vehicle #5002',       3,    'assigned',    'medium', 'oil_leak',         250)

  const ins_sr = db.prepare('INSERT INTO service_requests (customer_id, vehicle_txt, issue_txt, status_txt, est_cost, made_at) VALUES (?, ?, ?, ?, ?, ?)')
  const now = new Date().toISOString()
  ins_sr.run(301, '2021 Toyota Corolla', 'Brake inspection', 'pending',     180.00, now)
  ins_sr.run(301, '2018 Honda Civic',    'Oil change',       'completed',    59.99, now)
  ins_sr.run(301, '2021 Toyota Corolla', 'Tire rotation',    'in-progress',  40.00, now)
})

seed()

export { db }
