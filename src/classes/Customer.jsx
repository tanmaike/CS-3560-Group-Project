import { useState } from 'react'
import './App.css'

function Customer() {
  const [name, setName] = useState("");
  const [customerID] = useState(-1);
  const [insurancePolicyID, setInsurancePolicyID] = useState(-1);
  const [paymentsDue, setPaymentsDue] = useState(-1.0);
  const [vehicles, setVehicles] = useState([-1]);

  const createProfile = () => {
    /*
    ========================== TO-DO ==========================
    Implement function to set customer name, ID, insurance, payment,
    and vehicles upon profile creation
    */
    return
  }

  const updateInfo = () => {
    /* 
    ========================== TO-DO ==========================
    Implement function to set customer name, ID, insurance, payment,
    and vehicles upon updating profile information
    */
    return
  }

  const linkVehicle = () => {
    /* 
    ========================== TO-DO ==========================
    Implement function to add vehicle to customer profile's
    vehicles list
    */
    return
  }

  const viewVehicleStatus = () => {
    /* 
    ========================== TO-DO ==========================
    Implement function to return vehicle status on customer side
    (quotes, maintenance updates, appointments)
    */
    return
  }

  const linkInsurance = () => {
    /* 
    ========================== TO-DO ==========================
    Implement function to add/change insurance policy ID of customer profile
    */
    return
  }

  const recordIssueRequest = () => {
    /* 
    ========================== TO-DO ==========================
    Implement function that sends vehicle issue request made on
    customer side to mechanic side 
    */
    return
  }

  const makePayment = (money) => {
    /* 
    ========================== TO-DO ==========================
    Implement function to send payment through, upon sending payment,
    remove the payment from "paymentsDue"
    */
    return .0
  }

  return (
    <>
      <h1>mechanic</h1>
    </>
  )
}

export default Customer
