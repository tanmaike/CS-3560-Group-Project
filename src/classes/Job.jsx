import { useState } from 'react'
import './App.css'

function Job() {
  const [jobID, setJobID] = useState(-1);
  const [jobCode, setJobCode] = useState(-1);
  const [jobStatus, setJobStatus] = useState(false);
  const [jobQuote, setJobQuote] = useState(.0);
  const [mechanicId, setMechanicId] = useState([-1]);

  return (
    <>
      <h1>mechanic</h1>
    </>
  )
}

export default Job
