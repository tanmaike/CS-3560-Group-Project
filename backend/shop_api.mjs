// shop_api.mjs
import { createServer } from 'node:http'
import { parse as parse_url } from 'node:url'
import { db } from './db.mjs'

const API_PORT = Number(process.env.API_PORT || 8787)
const boot_tick = new Date().toISOString()

function send_json(res_obj, code_num, payload_obj) {
  res_obj.writeHead(code_num, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res_obj.end(JSON.stringify(payload_obj))
}

function read_json(req_obj) {
  return new Promise((ok_fn, no_fn) => {
    let raw_txt = ''
    req_obj.on('data', (chunk) => {
      raw_txt += chunk
      if (raw_txt.length > 1_000_000) {
        no_fn(new Error('too_big'))
      }
    })
    req_obj.on('end', () => {
      if (!raw_txt.trim()) {
        ok_fn({})
        return
      }
      try {
        ok_fn(JSON.parse(raw_txt))
      } catch {
        no_fn(new Error('bad_json'))
      }
    })
    req_obj.on('error', no_fn)
  })
}

function pull_job(id_num) {
  return db.prepare('SELECT * FROM jobs WHERE job_id = ?').get(id_num)
}

const app_srv = createServer(async (req_obj, res_obj) => {
  if (!req_obj.url || !req_obj.method) {
    send_json(res_obj, 400, { ok: false, msg: 'missing request bits' })
    return
  }

  if (req_obj.method === 'OPTIONS') {
    send_json(res_obj, 204, {})
    return
  }

  const parsed = parse_url(req_obj.url, true)
  const path_txt = parsed.pathname || ''
  const method_txt = req_obj.method.toUpperCase()

  // ── Health Check ──
  if (method_txt === 'GET' && path_txt === '/api/health') {
    send_json(res_obj, 200, {
      ok: true,
      up_since: boot_tick,
      job_count: db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n,
      ping_count: db.prepare('SELECT COUNT(*) AS n FROM cost_pings').get().n,
    })
    return
  }

  // ── GET All Jobs (with optional filters) ──
  if (method_txt === 'GET' && path_txt === '/api/jobs') {
    const status_q = parsed.query.status
    const mech_q = parsed.query.mechanic_id
    let sql = 'SELECT * FROM jobs WHERE 1=1'
    const params = []
    if (typeof status_q === 'string') { sql += ' AND status_txt = ?'; params.push(status_q) }
    if (typeof mech_q === 'string') { sql += ' AND mechanic_id = ?'; params.push(Number(mech_q)) }
    sql += ' ORDER BY job_id'
    send_json(res_obj, 200, { ok: true, jobs: db.prepare(sql).all(...params) })
    return
  }

  // ── CREATE Job ──
  if (method_txt === 'POST' && path_txt === '/api/jobs') {
    try {
      const body = await read_json(req_obj)
      const now = new Date().toISOString()
      const info = db.prepare(
          `INSERT INTO jobs (title_txt, customer_nm, vehicle_txt, vehicle_id, mechanic_id, status_txt, priority_txt, diag_code, est_cost, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
          String(body.title_txt || 'General Repair'),
          String(body.customer_nm || 'Unknown'),
          String(body.vehicle_txt || 'Unknown Vehicle'),
          body.vehicle_id ? Number(body.vehicle_id) : null,
          null,
          String(body.status_txt || 'pending'),
          String(body.priority_txt || 'medium'),
          String(body.diag_code || 'new_ticket'),
          Number(body.est_cost || 0),
          now
      )
      send_json(res_obj, 201, { ok: true, job: pull_job(info.lastInsertRowid) })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── GET Manager Jobs ──
  if (method_txt === 'GET' && path_txt === '/api/manager/jobs') {
    const rows = db.prepare('SELECT * FROM jobs ORDER BY job_id').all()
    send_json(res_obj, 200, {
      ok: true,
      jobs: rows.map((j) => ({
        jobId:        j.job_id,
        vehicleId:    j.vehicle_id,
        customerName: j.customer_nm,
        mechanicId:   j.mechanic_id,
        diagnosis:    j.diag_note || j.diag_code,
        jobQuote:     j.est_cost,
        jobStatus:    j.status_txt,
      })),
    })
    return
  }

  // ── GET Mechanics ──
  if (method_txt === 'GET' && path_txt === '/api/mechanics') {
    const rows = db.prepare('SELECT * FROM mechanics ORDER BY mechanic_id').all()
    const get_jobs = db.prepare("SELECT job_id FROM jobs WHERE mechanic_id = ? AND status_txt != 'terminated'")
    send_json(res_obj, 200, {
      ok: true,
      mechanics: rows.map((m) => ({
        mechanicId:   m.mechanic_id,
        name:         m.name_txt,
        assignedJobs: get_jobs.all(m.mechanic_id).map((j) => j.job_id),
      })),
    })
    return
  }

  // ── GET Manager Cost Pings ──
  if (method_txt === 'GET' && path_txt === '/api/manager/cost-pings') {
    send_json(res_obj, 200, { ok: true, pings: db.prepare('SELECT * FROM cost_pings ORDER BY ping_id').all() })
    return
  }

  // ── GET All Service Requests ──
  if (method_txt === 'GET' && path_txt === '/api/issues') {
    send_json(res_obj, 200, { ok: true, requests: db.prepare('SELECT * FROM service_requests ORDER BY req_id').all() })
    return
  }

  // ── Manager Assign Job ──
  if (method_txt === 'POST' && path_txt === '/api/manager/assign') {
    try {
      const body = await read_json(req_obj)
      const info = db.prepare(
          'INSERT INTO jobs (title_txt, customer_nm, vehicle_txt, status_txt, priority_txt, diag_code, est_cost, mechanic_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
          String(body.title_txt || 'General Repair'),
          String(body.customer_nm || 'Unknown Customer'),
          String(body.vehicle_txt || 'Unknown Vehicle'),
          'pending',
          String(body.priority_txt || 'medium'),
          'new_ticket',
          Number(body.est_cost || 0),
          body.mechanic_id ? Number(body.mechanic_id) : null,
      )
      send_json(res_obj, 201, { ok: true, job: pull_job(info.lastInsertRowid) })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── Customer Issue ──
  if (method_txt === 'POST' && path_txt === '/api/customer/issue') {
    try {
      const body = await read_json(req_obj)
      const info = db.prepare(
          'INSERT INTO service_requests (customer_nm, vehicle_id, vehicle_txt, issue_txt, made_at) VALUES (?, ?, ?, ?, ?)'
      ).run(
          String(body.customer_nm || 'unknown'),
          body.vehicle_id ? Number(body.vehicle_id) : null,
          String(body.vehicle_txt || 'unknown'),
          String(body.issue_txt || 'not provided'),
          new Date().toISOString(),
      )
      send_json(res_obj, 201, { ok: true, req_id: info.lastInsertRowid })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── GET/PATCH Customer by ID ──
  // (duplicate GET/PATCH customer by ID handler removed)

  // ── Customer Vehicles (GET & POST) ──
  const cust_veh_match = path_txt.match(/^\/api\/customers\/(\d+)\/vehicles$/)
  if (cust_veh_match) {
    const cust_id = Number(cust_veh_match[1])
    if (method_txt === 'GET') {
      const rows = db.prepare('SELECT * FROM vehicles WHERE customer_id = ? ORDER BY vehicle_id').all(cust_id)
      send_json(res_obj, 200, {
        ok: true,
        vehicles: rows.map((v) => ({
          id: v.vehicle_id, year: v.year_num, make: v.make_txt, model: v.model_txt,
          plate: v.plate_txt, status: v.status_txt, issue: v.issue_txt, appointment: v.appointment_txt,
        })),
      })
      return
    }
    if (method_txt === 'POST') {
      try {
        const body = await read_json(req_obj)
        db.prepare(
            'INSERT INTO vehicles (customer_id, year_num, make_txt, model_txt, plate_txt, status_txt, issue_txt, appointment_txt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
            cust_id,
            Number(body.year_num || 2020),
            String(body.make_txt || ''),
            String(body.model_txt || ''),
            String(body.plate_txt || ''),
            String(body.status_txt || 'No Active Service'),
            String(body.issue_txt || 'None'),
            String(body.appointment_txt || 'No appointment scheduled'),
        )
        send_json(res_obj, 201, { ok: true })
      } catch (err) {
        send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
      }
      return
    }
  }

  const cust_match = path_txt.match(/^\/api\/customers\/(\d+)$/)
  if (cust_match) {
    const cust_id = Number(cust_match[1])

    if (method_txt === 'GET') {
      const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
      if (!row) {
        send_json(res_obj, 404, { ok: false, msg: 'customer not found' })
        return
      }
      send_json(res_obj, 200, {
        ok: true,
        customer: {
          id: row.customer_id,
          name: row.name_txt,
          insuranceId: row.insurance_id,
          paymentsDue: row.payments_due,
        },
      })
      return
    }

    if (method_txt === 'PATCH') {
      try {
        const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
        if (!row) {
          send_json(res_obj, 404, { ok: false, msg: 'customer not found' })
          return
        }

        const body = await read_json(req_obj)
        const next_name = typeof body.name_txt === 'string' ? body.name_txt.trim() : row.name_txt
        const next_ins = body.insurance_id === undefined ? row.insurance_id : Number(body.insurance_id)
        const next_due = body.payments_due === undefined ? row.payments_due : Number(body.payments_due)

        if (!next_name) {
          send_json(res_obj, 400, { ok: false, msg: 'name_txt cannot be empty' })
          return
        }
        if (!Number.isFinite(next_ins)) {
          send_json(res_obj, 400, { ok: false, msg: 'insurance_id must be a number' })
          return
        }
        if (!Number.isFinite(next_due) || next_due < 0) {
          send_json(res_obj, 400, { ok: false, msg: 'payments_due must be >= 0' })
          return
        }

        const old_name = row.name_txt
        db.prepare('UPDATE customers SET name_txt = ?, insurance_id = ?, payments_due = ? WHERE customer_id = ?')
          .run(next_name, next_ins, next_due, cust_id)
        if (old_name !== next_name) {
          db.prepare('UPDATE jobs SET customer_nm = ? WHERE customer_nm = ?').run(next_name, old_name)
          db.prepare('UPDATE service_requests SET customer_nm = ? WHERE customer_nm = ?').run(next_name, old_name)
          db.prepare('UPDATE cost_pings SET customer_nm = ? WHERE customer_nm = ?').run(next_name, old_name)
        }

        const updated = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
        send_json(res_obj, 200, {
          ok: true,
          customer: {
            id: updated.customer_id,
            name: updated.name_txt,
            insuranceId: updated.insurance_id,
            paymentsDue: updated.payments_due,
          },
        })
      } catch (err) {
        send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
      }
      return
    }
  }

  const cust_pay_match = path_txt.match(/^\/api\/customers\/(\d+)\/payments$/)
  if (cust_pay_match && method_txt === 'POST') {
    try {
      const cust_id = Number(cust_pay_match[1])
      const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
      if (!row) {
        send_json(res_obj, 404, { ok: false, msg: 'customer not found' })
        return
      }

      const body = await read_json(req_obj)
      const amount_num = Number(body.amount_num)
      if (!Number.isFinite(amount_num) || amount_num <= 0) {
        send_json(res_obj, 400, { ok: false, msg: 'amount_num must be > 0' })
        return
      }

      db.prepare('UPDATE customers SET payments_due = MAX(payments_due - ?, 0) WHERE customer_id = ?')
        .run(amount_num, cust_id)

      const updated = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
      send_json(res_obj, 200, {
        ok: true,
        customer: {
          id: updated.customer_id,
          name: updated.name_txt,
          insuranceId: updated.insurance_id,
          paymentsDue: updated.payments_due,
        },
      })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  const cust_sr_match = path_txt.match(/^\/api\/customers\/(\d+)\/service-requests$/)
  if (cust_sr_match) {
    const cust_id = Number(cust_sr_match[1])

    if (method_txt === 'GET') {
      const customer = db.prepare('SELECT name_txt FROM customers WHERE customer_id = ?').get(cust_id)
      const cust_name = customer ? customer.name_txt : ''

      const rows = db.prepare('SELECT * FROM service_requests WHERE customer_id = ? ORDER BY req_id').all(cust_id)

      // Enrich with job status info
      const enriched = rows.map((r) => {
        const job = r.vehicle_id
            ? db.prepare(
                'SELECT status_txt, est_cost, mechanic_id, completed_at FROM jobs WHERE vehicle_id = ? ORDER BY job_id DESC LIMIT 1'
            ).get(r.vehicle_id)
            : db.prepare(
                "SELECT status_txt, est_cost, mechanic_id, completed_at FROM jobs WHERE customer_nm = ? AND vehicle_txt LIKE ? ORDER BY job_id DESC LIMIT 1"
            ).get(cust_name, r.vehicle_txt + '%')

        return {
          id: r.req_id,
          vehicleId: r.vehicle_id,
          vehicle: r.vehicle_txt,
          request: r.issue_txt,
          status: job ? job.status_txt : r.status_txt,
          estimatedCost: job ? job.est_cost : r.est_cost,
          mechanicId: job ? job.mechanic_id : null,
          completedAt: job ? job.completed_at : null,
          invoiceId: null,
          invoiceAmount: null,
        }
      })

      // Get invoices for this customer's requests
      const invoices = db.prepare(
          `SELECT c.*, j.vehicle_id
           FROM cost_pings c
           LEFT JOIN jobs j ON c.job_id = j.job_id
           WHERE c.customer_nm = ?
           ORDER BY c.ping_id DESC`
      ).all(cust_name)

      enriched.forEach(req => {
        const invoice = invoices.find(inv => req.vehicleId && inv.vehicle_id === req.vehicleId)
        if (invoice) {
          req.invoiceId = invoice.ping_id
          req.invoiceAmount = invoice.amount_num
        }
      })

      send_json(res_obj, 200, { ok: true, requests: enriched })
      return
    }

    if (method_txt === 'POST') {
      try {
        const body = await read_json(req_obj)
        const customer = db.prepare('SELECT name_txt FROM customers WHERE customer_id = ?').get(cust_id)

        db.prepare(
            'INSERT INTO service_requests (customer_id, customer_nm, vehicle_id, vehicle_txt, issue_txt, est_cost, made_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
            cust_id,
            customer ? customer.name_txt : 'Unknown',
            body.vehicle_id ? Number(body.vehicle_id) : null,
            String(body.vehicle_txt || 'unknown'),
            String(body.issue_txt || 'not provided'),
            Number(body.est_cost || 0),
            new Date().toISOString(),
        )
        send_json(res_obj, 201, { ok: true })
      } catch (err) {
        send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
      }
      return
    }
  }

  // ── Customer Payment ──
  const cust_payment_match = path_txt.match(/^\/api\/customers\/(\d+)\/payment$/)
  if (cust_payment_match && method_txt === 'PATCH') {
    try {
      const cust_id = Number(cust_payment_match[1])
      const body = await read_json(req_obj)
      const amount = Number(body.amount_num)

      if (!Number.isFinite(amount) || amount <= 0) {
        send_json(res_obj, 400, { ok: false, msg: 'amount_num must be positive' })
        return
      }

      const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
      if (!customer) {
        send_json(res_obj, 404, { ok: false, msg: 'customer not found' })
        return
      }

      const newBalance = Math.max(0, customer.payments_due - amount)
      db.prepare('UPDATE customers SET payments_due = ? WHERE customer_id = ?')
          .run(newBalance, cust_id)

      send_json(res_obj, 200, {
        ok: true,
        payments_due: newBalance,
        paid: amount
      })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── Customer Invoices ──
  const cust_invoices_match = path_txt.match(/^\/api\/customers\/(\d+)\/invoices$/)
  if (cust_invoices_match && method_txt === 'GET') {
    const cust_id = Number(cust_invoices_match[1])
    const customer = db.prepare('SELECT name_txt FROM customers WHERE customer_id = ?').get(cust_id)
    if (!customer) {
      send_json(res_obj, 404, { ok: false, msg: 'customer not found' })
      return
    }

    const invoices = db.prepare(`
      SELECT c.ping_id, c.job_id, c.customer_nm, c.vehicle_txt, c.amount_num, c.made_at, c.paid_at,
             j.status_txt as job_status, j.title_txt
      FROM cost_pings c
             LEFT JOIN jobs j ON c.job_id = j.job_id
      WHERE c.customer_nm = ?
      ORDER BY c.ping_id DESC
    `).all(customer.name_txt)

    send_json(res_obj, 200, { ok: true, invoices })
    return
  }

  // ── Pay Invoice ──
  const pay_invoice_match = path_txt.match(/^\/api\/invoices\/(\d+)\/pay$/)
  if (pay_invoice_match && method_txt === 'PATCH') {
    try {
      const ping_id = Number(pay_invoice_match[1])
      const ping = db.prepare('SELECT * FROM cost_pings WHERE ping_id = ?').get(ping_id)
      if (!ping) {
        send_json(res_obj, 404, { ok: false, msg: 'invoice not found' })
        return
      }

      if (ping.paid_at) {
        send_json(res_obj, 400, { ok: false, msg: 'Invoice already paid' })
        return
      }

      const customer = db.prepare("SELECT * FROM customers WHERE name_txt = ?").get(ping.customer_nm)
      if (customer) {
        const newBalance = Math.max(0, customer.payments_due - ping.amount_num)
        db.prepare('UPDATE customers SET payments_due = ? WHERE customer_id = ?')
            .run(newBalance, customer.customer_id)

        // Mark invoice as paid
        db.prepare('UPDATE cost_pings SET paid_at = ? WHERE ping_id = ?')
            .run(new Date().toISOString(), ping_id)

        send_json(res_obj, 200, {
          ok: true,
          msg: `Invoice #${ping_id} paid`,
          payments_due: newBalance,
          paid: ping.amount_num
        })
      } else {
        send_json(res_obj, 404, { ok: false, msg: 'customer not found for invoice' })
      }
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── Sync Job Completion to Service Request ──
  const sync_sr_match = path_txt.match(/^\/api\/jobs\/(\d+)\/sync-to-request$/)
  if (sync_sr_match && method_txt === 'PATCH') {
    try {
      const job_id = Number(sync_sr_match[1])
      const job = pull_job(job_id)
      if (!job) {
        send_json(res_obj, 404, { ok: false, msg: 'job not found' })
        return
      }

      // Update matching service request status
      db.prepare(
          "UPDATE service_requests SET status_txt = ?, est_cost = ? WHERE vehicle_id = ? AND status_txt != ?"
      ).run(
          job.status_txt,
          job.est_cost,
          job.vehicle_id,
          'completed'
      )

      send_json(res_obj, 200, { ok: true, msg: 'Service request synced' })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── GET Single Job ──
  const job_match = path_txt.match(/^\/api\/jobs\/(\d+)$/)
  if (job_match && method_txt === 'GET') {
    const id_num = Number(job_match[1])
    const row = pull_job(id_num)
    if (!row) {
      send_json(res_obj, 404, { ok: false, msg: 'job not found' })
      return
    }
    send_json(res_obj, 200, { ok: true, job: row })
    return
  }

  // ── Manager Assign Mechanic to Job ──
  const mgr_assign_match = path_txt.match(/^\/api\/manager\/jobs\/(\d+)\/assign$/)
  if (mgr_assign_match && method_txt === 'PATCH') {
    try {
      const id_num = Number(mgr_assign_match[1])
      const row = pull_job(id_num)
      if (!row) {
        send_json(res_obj, 404, { ok: false, msg: 'job not found' })
        return
      }
      const body = await read_json(req_obj)
      const mech_id = body.mechanic_id === null ? null : (Number(body.mechanic_id) || null)
      const new_status = mech_id ? 'assigned' : 'pending'
      db.prepare('UPDATE jobs SET mechanic_id = ?, status_txt = ?, updated_at = ? WHERE job_id = ?')
        .run(mech_id, new_status, new Date().toISOString(), id_num)
      db.prepare('UPDATE service_requests SET status_txt = ? WHERE vehicle_id = ?')
        .run(new_status, row.vehicle_id)
      send_json(res_obj, 200, { ok: true })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── Manager Terminate Job ──
  const mgr_term_match = path_txt.match(/^\/api\/manager\/jobs\/(\d+)\/terminate$/)
  if (mgr_term_match && method_txt === 'PATCH') {
    const id_num = Number(mgr_term_match[1])
    const row = pull_job(id_num)
    if (!row) {
      send_json(res_obj, 404, { ok: false, msg: 'job not found' })
      return
    }
    const now = new Date().toISOString()
    db.prepare('UPDATE jobs SET status_txt = ?, mechanic_id = NULL, updated_at = ? WHERE job_id = ?')
      .run('terminated', now, id_num)
    db.prepare('UPDATE service_requests SET status_txt = ? WHERE vehicle_id = ?')
      .run('terminated', row.vehicle_id)
    send_json(res_obj, 200, { ok: true })
    return
  }

  // ── Update Job Status ──
  const status_match = path_txt.match(/^\/api\/jobs\/(\d+)\/status$/)
  if (status_match && method_txt === 'PATCH') {
    try {
      const id_num = Number(status_match[1])
      const row = pull_job(id_num)
      if (!row) {
        send_json(res_obj, 404, { ok: false, msg: 'job not found' })
        return
      }
      const body = await read_json(req_obj)
      const nxt = String(body.status_txt || '').trim()
      if (!nxt) {
        send_json(res_obj, 400, { ok: false, msg: 'status_txt is required' })
        return
      }
      const now = new Date().toISOString()
      db.prepare('UPDATE jobs SET status_txt = ?, updated_at = ?, completed_at = ? WHERE job_id = ?')
        .run(nxt, now, nxt === 'completed' ? now : row.completed_at, id_num)
      db.prepare('UPDATE service_requests SET status_txt = ? WHERE vehicle_id = ?')
        .run(nxt, row.vehicle_id)
      send_json(res_obj, 200, { ok: true, job: pull_job(id_num) })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── Record Diagnosis ──
  const diag_match = path_txt.match(/^\/api\/jobs\/(\d+)\/diagnosis$/)
  if (diag_match && method_txt === 'POST') {
    try {
      const id_num = Number(diag_match[1])
      const row = pull_job(id_num)
      if (!row) {
        send_json(res_obj, 404, { ok: false, msg: 'job not found' })
        return
      }
      const body = await read_json(req_obj)
      db.prepare('UPDATE jobs SET diag_code = ?, diag_note = ?, diag_at = ?, status_txt = ? WHERE job_id = ?')
          .run(
              String(body.diag_code || row.diag_code || 'diag_pending'),
              String(body.diag_note || ''),
              new Date().toISOString(),
              'in-progress',
              id_num,
          )

      // Update service request status
      db.prepare(
          "UPDATE service_requests SET status_txt = 'in-progress' WHERE vehicle_id = ? AND status_txt NOT IN ('completed', 'terminated')"
      ).run(row.vehicle_id)

      send_json(res_obj, 200, { ok: true, job: pull_job(id_num) })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── Submit Quote / Cost Notification ──
  const quote_match = path_txt.match(/^\/api\/jobs\/(\d+)\/quote$/)
  if (quote_match && method_txt === 'POST') {
    try {
      const id_num = Number(quote_match[1])
      const row = pull_job(id_num)
      if (!row) {
        send_json(res_obj, 404, { ok: false, msg: 'job not found' })
        return
      }
      const body = await read_json(req_obj)
      const amt = Number(body.amount_num)
      if (!Number.isFinite(amt) || amt < 0) {
        send_json(res_obj, 400, { ok: false, msg: 'amount_num must be >= 0' })
        return
      }
      const now = new Date().toISOString()

      // Update the job cost and status
      db.prepare('UPDATE jobs SET est_cost = ?, status_txt = ?, quote_at = ? WHERE job_id = ?')
        .run(amt, 'quoted', now, id_num)
        db.prepare('UPDATE service_requests SET est_cost = ? WHERE vehicle_id = ?')
            .run(amt, row.vehicle_id)
      const ping_id = db.prepare(
        'INSERT INTO cost_pings (job_id, customer_nm, vehicle_txt, amount_num, made_at) VALUES (?, ?, ?, ?, ?)'
      ).run(row.job_id, row.customer_nm, row.vehicle_txt, amt, now).lastInsertRowid
      
      // Update customer's payments_due to include the new invoice amount
      const cust = db.prepare('SELECT customer_id FROM customers WHERE name_txt = ?').get(row.customer_nm)
      if (cust) {
        db.prepare('UPDATE customers SET payments_due = payments_due + ? WHERE customer_id = ?')
          .run(amt, cust.customer_id)
      }
      
      send_json(res_obj, 200, {
        ok: true,
        job: pull_job(id_num),
        ping: db.prepare('SELECT * FROM cost_pings WHERE ping_id = ?').get(ping_id),
      })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── GET Customer Appointments ──
  const cust_appt_match = path_txt.match(/^\/api\/customers\/(\d+)\/appointments$/)
  if (cust_appt_match && method_txt === 'GET') {
    const cust_id = Number(cust_appt_match[1])
    const rows = db.prepare('SELECT * FROM appointments WHERE customer_id = ? ORDER BY scheduled_at DESC').all(cust_id)
    
    const formatted = rows.map((a) => {
      const vehicle = db.prepare('SELECT * FROM vehicles WHERE vehicle_id = ?').get(a.vehicle_id)
      const mechanic = a.mechanic_id ? db.prepare('SELECT * FROM mechanics WHERE mechanic_id = ?').get(a.mechanic_id) : null
      return {
        appointmentId: a.appointment_id,
        vehicleId: a.vehicle_id,
        vehicleDisplay: vehicle ? `${vehicle.year_num} ${vehicle.make_txt} ${vehicle.model_txt}` : 'Unknown',
        scheduledAt: a.scheduled_at,
        serviceType: a.service_type,
        mechanicId: a.mechanic_id,
        mechanicName: mechanic ? mechanic.name_txt : null,
        preferredMechanicId: a.preferred_mechanic_id,
        status: a.status_txt,
        notes: a.notes_txt,
        createdAt: a.created_at,
      }
    })
    
    send_json(res_obj, 200, { ok: true, appointments: formatted })
    return
  }

  // ── CREATE Customer Appointment ──
  if (cust_appt_match && method_txt === 'POST') {
    try {
      const cust_id = Number(cust_appt_match[1])
      const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(cust_id)
      if (!customer) {
        send_json(res_obj, 404, { ok: false, msg: 'customer not found' })
        return
      }

      const body = await read_json(req_obj)
      const vehicleId = Number(body.vehicleId)
      const scheduledAt = String(body.scheduledAt || '')
      const serviceType = String(body.serviceType || '')
      const preferredMechanicId = body.preferredMechanicId ? Number(body.preferredMechanicId) : null
      const notes = String(body.notes || '')

      if (!vehicleId || !scheduledAt || !serviceType) {
        send_json(res_obj, 400, { ok: false, msg: 'vehicleId, scheduledAt, and serviceType are required' })
        return
      }

      const vehicle = db.prepare('SELECT * FROM vehicles WHERE vehicle_id = ? AND customer_id = ?').get(vehicleId, cust_id)
      if (!vehicle) {
        send_json(res_obj, 404, { ok: false, msg: 'vehicle not found for this customer' })
        return
      }

      // Mechanic load-balancing logic
      const mechanics = db.prepare('SELECT mechanic_id FROM mechanics ORDER BY mechanic_id').all()
      let assignedMechanicId = null
      let minJobCount = Infinity

      for (const mech of mechanics) {
        const jobCount = db.prepare(
          "SELECT COUNT(*) as n FROM jobs WHERE mechanic_id = ? AND status_txt NOT IN ('completed', 'terminated')"
        ).get(mech.mechanic_id).n
        
        if (jobCount < minJobCount) {
          minJobCount = jobCount
          assignedMechanicId = mech.mechanic_id
        }
      }

      // If preferred mechanic provided, use them if available
      if (preferredMechanicId) {
        const preferred = db.prepare('SELECT mechanic_id FROM mechanics WHERE mechanic_id = ?').get(preferredMechanicId)
        if (preferred) {
          assignedMechanicId = preferredMechanicId
        }
      }

      const now = new Date().toISOString()
      const info = db.prepare(
        'INSERT INTO appointments (customer_id, vehicle_id, scheduled_at, service_type, mechanic_id, preferred_mechanic_id, status_txt, notes_txt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        cust_id,
        vehicleId,
        scheduledAt,
        serviceType,
        assignedMechanicId,
        preferredMechanicId,
        'pending',
        notes,
        now
      )

      // Keep the customer vehicle table in sync with scheduled appointments.
      db.prepare('UPDATE vehicles SET appointment_txt = ? WHERE vehicle_id = ?')
        .run(scheduledAt, vehicleId)

      const appt = db.prepare('SELECT * FROM appointments WHERE appointment_id = ?').get(info.lastInsertRowid)
      const mechanic = assignedMechanicId ? db.prepare('SELECT * FROM mechanics WHERE mechanic_id = ?').get(assignedMechanicId) : null

      send_json(res_obj, 201, {
        ok: true,
        appointment: {
          appointmentId: appt.appointment_id,
          vehicleId: appt.vehicle_id,
          scheduledAt: appt.scheduled_at,
          serviceType: appt.service_type,
          mechanicId: appt.mechanic_id,
          mechanicName: mechanic ? mechanic.name_txt : null,
          status: appt.status_txt,
          notes: appt.notes_txt,
        }
      })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  // ── GET Available Appointment Slots ──
  if (method_txt === 'GET' && path_txt === '/api/appointments/available-slots') {
    const mechanics = db.prepare('SELECT * FROM mechanics ORDER BY mechanic_id').all()
    
    // Generate available slots for next 30 days, excluding past dates and weekends
    const slots = []
    const timeSlots = ['09:00', '10:00', '13:00', '15:00'] // 9AM, 10AM, 1PM, 3PM
    const now = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const dateStr = date.toISOString().split('T')[0]
      
      for (const time of timeSlots) {
        const scheduledAt = `${dateStr}T${time}:00`
        
        // Check if any appointments exist at this time
        const existing = db.prepare('SELECT COUNT(*) as n FROM appointments WHERE scheduled_at = ?').get(scheduledAt).n
        if (existing > 0) continue // Skip booked slots
        
        // Get mechanic workloads
        const mechanicSlots = mechanics.map((m) => {
          const activeJobs = db.prepare(
            "SELECT COUNT(*) as n FROM jobs WHERE mechanic_id = ? AND status_txt NOT IN ('completed', 'terminated')"
          ).get(m.mechanic_id).n
          
          return {
            mechanicId: m.mechanic_id,
            mechanicName: m.name_txt,
            activeJobCount: activeJobs,
          }
        })
        
        slots.push({
          date: dateStr,
          time: time,
          dateTime: scheduledAt,
          mechanics: mechanicSlots,
        })
      }
    }
    
    send_json(res_obj, 200, { ok: true, availableSlots: slots })
    return
  }

  // ── 404 Catch-All ──
  send_json(res_obj, 404, { ok: false, msg: 'route not found' })
})

app_srv.listen(API_PORT, '0.0.0.0', () => {
  console.log(`[shop_api] listening on http://0.0.0.0:${API_PORT}`)
})
