import { useState } from 'react'
import './App.css'

function Mechanic() {
    const [name, setName] = useState("");
    const [mechanicID, setMechanicID] = useState(-1);
    const [assignedJobs, setAssignedJobs] = useState([-1]);

    const recordVehicleDiagnosis = () => {
        /* 
        ========================== TO-DO ==========================
        Implement function for mechanic to set vehicle diagnosis to
        vehicle's "vehicleStatusCode"
        */
        return
    };

    const notifyCost = (cost) => {
        /* 
        ========================== TO-DO ==========================
        Implement function for mechanic to send payment to Mangaer for Manager
        to send add to customer's "paymentsDue"
        */
        return
    };

    const viewAssignedJobs = () => {
        return assignedJobs
    };

    const markJobCompleted = (jobID) => {
        /* 
        ========================== TO-DO ==========================
        Implement function for mechanic to mark job as complete from "assignedJobs"
        */
        return
    };

    return (
    <>
        <h1>mechanic</h1>
    </>
    )
}

export default Mechanic
