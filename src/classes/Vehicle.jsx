import { useState } from 'react'
import './App.css'

function Vehicle() {
  const [vehicleID, setVehicleID] = useState(-1);
  const [owner, setOwner] = useState("");
  const [mechanicID, setMechanicID] = useState([-1]);
  const [jobID, setJobID] = useState([-1]);
  const [vehicleStatusCode, setVehicleStatusCode] = useState(-1);
  const [insurancePolicyID, setInsurancePolicyID] = useState(-1);

  return (
    <>
      <h1>mechanic</h1>
    </>
  )
}

export default Vehicle
