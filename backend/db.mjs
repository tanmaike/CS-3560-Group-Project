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
  CREATE TABLE IF NOT EXISTS auth_users (
                                          user_id      INTEGER PRIMARY KEY AUTOINCREMENT,
                                          username_txt TEXT NOT NULL UNIQUE,
                                          password_txt TEXT NOT NULL,
                                          role_txt     TEXT NOT NULL,
                                          ref_id       INTEGER,
                                          display_nm   TEXT
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
  ins_m.run(1, 'Grease Wizard Greg')
  ins_m.run(2, 'Torque Queen Tasha')
  ins_m.run(3, 'Bolt Whisperer Benji')
  ins_m.run(4, 'Muffler Oracle Mo')

  const ins_c = db.prepare(
    'INSERT INTO customers (customer_id, name_txt, insurance_id, payments_due) VALUES (?, ?, ?, ?)'
  )
  ins_c.run(301, 'Brock Sidequest', 880001, 73.42)
  ins_c.run(302, 'Lana Turnsignal', 880002, 12.05)
  ins_c.run(303, 'Derek NoBrakes', 880003, 0)
  ins_c.run(304, 'Priya ParallelPark', 880004, 404.04)

  const ins_v = db.prepare('INSERT INTO vehicles (customer_id, year_num, make_txt, model_txt, plate_txt, status_txt, issue_txt, appointment_txt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  ins_v.run(301, 2004, 'Pontiac', 'Aztek', 'NOPE911', 'In Service', 'Steering wheel only works when threatened', '2026-05-12 07:45 AM')
  ins_v.run(302, 2015, 'Nissan', 'Altima', 'BLNKR00', 'Awaiting Parts', 'Horn plays one angry jazz note nonstop', '2026-05-13 10:20 AM')
  ins_v.run(303, 1998, 'Jeep', 'Cherokee', 'WLD-RDE', 'Ready for Pickup', 'Left mirror reflects bad decisions only', '2026-05-11 04:40 PM')
  ins_v.run(304, 2023, 'Tesla', 'Model 3', 'AI-OOPS', 'No Active Service', 'Owner reports phantom apologies from dashboard', 'No appointment scheduled')
  ins_v.run(301, 2009, 'Dodge', 'Grand Caravan', 'SNK-SND', 'In Service', 'Sliding door opens when it hears gossip', '2026-05-14 12:10 PM')

  const ins_j = db.prepare('INSERT INTO jobs (title_txt, customer_nm, vehicle_txt, vehicle_id, mechanic_id, status_txt, priority_txt, diag_code, est_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  ins_j.run('Emergency Brake Line Mystery', 'Brock Sidequest', '2004 Pontiac Aztek (NOPE911)', 1, 1, 'in-progress', 'high', 'someone_cut_brake_lines', 1337.00)
  ins_j.run('Horn Possession Extraction', 'Lana Turnsignal', '2015 Nissan Altima (BLNKR00)', 2, 2, 'assigned', 'medium', 'horn_is_haunted', 666.66)
  ins_j.run('Mirror Reality Calibration', 'Derek NoBrakes', '1998 Jeep Cherokee (WLD-RDE)', 3, 3, 'quoted', 'low', 'existential_reflection_fault', 222.22)
  ins_j.run('Minivan Gossip Sensor Disable', 'Brock Sidequest', '2009 Dodge Grand Caravan (SNK-SND)', 5, 4, 'pending', 'high', 'door_hears_tea', 909.09)
  ins_j.run('Corporate Van Vibe Audit', 'MegaParcel Bros', '2012 Ford Transit (FLEET13)', null, null, 'pending', 'medium', 'suspicious_rattle_choir', 512.34)
  ins_j.run('Truck Oil Leak or BBQ Sauce', 'Municipal Lawn Ninjas', '2011 Chevy Silverado (MOW-BIZ)', null, 3, 'assigned', 'medium', 'unknown_viscous_substance', 777.77)

  const ins_sr = db.prepare('INSERT INTO service_requests (customer_id, customer_nm, vehicle_id, vehicle_txt, issue_txt, status_txt, est_cost, made_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const now = new Date().toISOString()
  ins_sr.run(301, 'Brock Sidequest', 1, '2004 Pontiac Aztek', 'Car slows down only after a prayer circle', 'in-progress', 1337.00, now)
  ins_sr.run(302, 'Lana Turnsignal', 2, '2015 Nissan Altima', 'Horn starts beef with pedestrians at red lights', 'assigned', 666.66, now)
  ins_sr.run(303, 'Derek NoBrakes', 3, '1998 Jeep Cherokee', 'Mirror keeps showing scenes from 2007', 'quoted', 222.22, now)
  ins_sr.run(301, 'Brock Sidequest', 5, '2009 Dodge Grand Caravan', 'Door opens itself whenever coworkers whisper', 'pending', 909.09, now)

  const ins_ping = db.prepare(
    'INSERT INTO cost_pings (job_id, customer_nm, vehicle_txt, amount_num, made_at, paid_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  ins_ping.run(3, 'Derek NoBrakes', '1998 Jeep Cherokee (WLD-RDE)', 222.22, now, null)

  const ins_u = db.prepare(
    'INSERT INTO auth_users (username_txt, password_txt, role_txt, ref_id, display_nm) VALUES (?, ?, ?, ?, ?)'
  )
  ins_u.run('brook.sidequest', 'brakesWho', 'customer', 301, 'Brock Sidequest')
  ins_u.run('lana.blink', 'jazzhorn42', 'customer', 302, 'Lana Turnsignal')
  ins_u.run('derek.nobrakes', 'stopsAreOptional', 'customer', 303, 'Derek NoBrakes')
  ins_u.run('priya.park', 'parallelLegend', 'customer', 304, 'Priya ParallelPark')
  ins_u.run('greg.grease', 'wrenchwrench', 'mechanic', 1, 'Grease Wizard Greg')
  ins_u.run('tasha.torque', 'queenOfLugs', 'mechanic', 2, 'Torque Queen Tasha')
  ins_u.run('benji.bolts', 'socketRocket', 'mechanic', 3, 'Bolt Whisperer Benji')
  ins_u.run('mo.oracle', 'mufflerProphecy', 'mechanic', 4, 'Muffler Oracle Mo')
  ins_u.run('manager.chaos', 'clipBoardBoss', 'manager', 1, 'Shop Manager')
})

seed()

const ensureAuthUsers = db.transaction(() => {
  const row = db.prepare('SELECT COUNT(*) AS n FROM auth_users').get()
  if ((row?.n || 0) > 0) return
  const ins_u = db.prepare(
    'INSERT INTO auth_users (username_txt, password_txt, role_txt, ref_id, display_nm) VALUES (?, ?, ?, ?, ?)'
  )
  ins_u.run('brook.sidequest', 'brakesWho', 'customer', 301, 'Brock Sidequest')
  ins_u.run('lana.blink', 'jazzhorn42', 'customer', 302, 'Lana Turnsignal')
  ins_u.run('derek.nobrakes', 'stopsAreOptional', 'customer', 303, 'Derek NoBrakes')
  ins_u.run('priya.park', 'parallelLegend', 'customer', 304, 'Priya ParallelPark')
  ins_u.run('greg.grease', 'wrenchwrench', 'mechanic', 1, 'Grease Wizard Greg')
  ins_u.run('tasha.torque', 'queenOfLugs', 'mechanic', 2, 'Torque Queen Tasha')
  ins_u.run('benji.bolts', 'socketRocket', 'mechanic', 3, 'Bolt Whisperer Benji')
  ins_u.run('mo.oracle', 'mufflerProphecy', 'mechanic', 4, 'Muffler Oracle Mo')
  ins_u.run('manager.chaos', 'clipBoardBoss', 'manager', 1, 'Shop Manager')
})

ensureAuthUsers()

export { db }
