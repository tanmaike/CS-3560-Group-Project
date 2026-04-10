import { createServer } from 'node:http'
import { parse as parse_url } from 'node:url'

const API_PORT = Number(process.env.API_PORT || 8787)
const boot_tick = new Date().toISOString()

const state_box = {
  job_pool: [
    {
      job_id: 201,
      title_txt: 'Oil Change',
      customer_nm: 'John Smith',
      vehicle_txt: '2020 Toyota Camry',
      status_txt: 'pending',
      priority_txt: 'low',
      diag_code: 'needs_oil_change',
      est_cost: 49.99,
    },
    {
      job_id: 202,
      title_txt: 'Brake Pad Replacement',
      customer_nm: 'Sarah Johnson',
      vehicle_txt: '2019 Honda CR-V',
      status_txt: 'in-progress',
      priority_txt: 'high',
      diag_code: 'brake_issue',
      est_cost: 299.99,
    },
  ],
  cost_pings: [],
  issue_queue: [],
}

function send_json(res_obj, code_num, payload_obj) {
  res_obj.writeHead(code_num, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
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
  return state_box.job_pool.find((j) => j.job_id === id_num)
}

function next_job_id() {
  const hi = state_box.job_pool.reduce((m, j) => Math.max(m, j.job_id), 200)
  return hi + 1
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

  if (method_txt === 'GET' && path_txt === '/api/health') {
    send_json(res_obj, 200, {
      ok: true,
      up_since: boot_tick,
      job_count: state_box.job_pool.length,
      ping_count: state_box.cost_pings.length,
    })
    return
  }

  if (method_txt === 'GET' && path_txt === '/api/jobs') {
    const status_q = parsed.query.status
    const rows =
      typeof status_q === 'string'
        ? state_box.job_pool.filter((j) => j.status_txt === status_q)
        : state_box.job_pool
    send_json(res_obj, 200, { ok: true, jobs: rows })
    return
  }

  if (method_txt === 'GET' && path_txt === '/api/manager/cost-pings') {
    send_json(res_obj, 200, { ok: true, pings: state_box.cost_pings })
    return
  }

  if (method_txt === 'POST' && path_txt === '/api/manager/assign') {
    try {
      const body = await read_json(req_obj)
      const fresh_job = {
        job_id: next_job_id(),
        title_txt: String(body.title_txt || 'General Repair'),
        customer_nm: String(body.customer_nm || 'Unknown Customer'),
        vehicle_txt: String(body.vehicle_txt || 'Unknown Vehicle'),
        status_txt: 'pending',
        priority_txt: String(body.priority_txt || 'medium'),
        diag_code: 'new_ticket',
        est_cost: Number(body.est_cost || 0),
      }
      state_box.job_pool.push(fresh_job)
      send_json(res_obj, 201, { ok: true, job: fresh_job })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  if (method_txt === 'POST' && path_txt === '/api/customer/issue') {
    try {
      const body = await read_json(req_obj)
      const ticket = {
        req_id: state_box.issue_queue.length + 1,
        customer_nm: String(body.customer_nm || 'unknown'),
        vehicle_txt: String(body.vehicle_txt || 'unknown'),
        issue_txt: String(body.issue_txt || 'not provided'),
        made_at: new Date().toISOString(),
      }
      state_box.issue_queue.push(ticket)
      send_json(res_obj, 201, { ok: true, ticket })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

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
      row.status_txt = nxt
      row.updated_at = new Date().toISOString()
      send_json(res_obj, 200, { ok: true, job: row })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

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
      row.diag_code = String(body.diag_code || row.diag_code || 'diag_pending')
      row.diag_note = String(body.diag_note || '')
      row.diag_at = new Date().toISOString()
      send_json(res_obj, 200, { ok: true, job: row })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

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
      row.est_cost = amt
      row.quote_at = new Date().toISOString()

      const ping = {
        ping_id: state_box.cost_pings.length + 1,
        job_id: row.job_id,
        customer_nm: row.customer_nm,
        vehicle_txt: row.vehicle_txt,
        amount_num: amt,
        made_at: new Date().toISOString(),
      }
      state_box.cost_pings.push(ping)

      send_json(res_obj, 200, { ok: true, job: row, ping })
    } catch (err) {
      send_json(res_obj, 400, { ok: false, msg: String(err.message || err) })
    }
    return
  }

  send_json(res_obj, 404, { ok: false, msg: 'route not found' })
})

app_srv.listen(API_PORT, '0.0.0.0', () => {
  // quick startup print
  console.log(`[shop_api] listening on http://0.0.0.0:${API_PORT}`)
})
