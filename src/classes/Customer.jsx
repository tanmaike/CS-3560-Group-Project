import { useState } from 'react'
import './App.css'

function Customer() {
  const [name, setName] = useState("");
  const [customerID] = useState(-1);
  const [insurancePolicyID, setInsurancePolicyID] = useState(-1);
  const [paymentsDue, setPaymentsDue] = useState(-1.0);
  const [vehicles, setVehicles] = useState([-1]);

  const updateProfile = () => {
    return
  }

  const updateInfo = () => {
    return
  }

  const linkVehicle = () => {
    return
  }

  const viewVehicleStatus = () => {
    return
  }

  const linkInsurance = () => {
    return
  }

  const recordIssueRequest = () => {
    return
  }

  const makePayment = (money) => {
    return .0
  }

  return (
    <>
      <h1>mechanic</h1>
    </>
  )
}

export default Customer
