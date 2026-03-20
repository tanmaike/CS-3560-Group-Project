import { useState } from 'react'
import './App.css'

function Manager() {
  const [name, setName] = "";
  const [managerID, setManagerID] = -1;

  const terminateJob = (jobID) => {
    /* 
    ========================== TO-DO ==========================
    Implement function to remove job from mechanic's "assignedJobs"
    */
    return
  }

  const recordQuote = (quoteID) => {
    /* 
    ========================== TO-dDO ==========================
    Implement function where upon completion of mechanic assigned job, 
    create quote for payment that will go through to customer side, adding to "paymentsDue"
    */
    return
  }

  const updateQuote = (quoteID) => {
    /* 
    ========================== TO-DO ==========================
    Implement function where upon receieving vehicle diagnosis and
    cost from mechanic, update quote for payment accordingly for
    customer side
    */
    return
  }

  const assignMechanics = (mechanicID) => {
    /* 
    ========================== TO-DO ==========================
    Implement function to add a job to mechanic's "assignedJobs"
    */
    return
  }

  return (
    <>
      <h1>mechanic</h1>
    </>
  )
}

export default Manager
