import { useState } from 'react'
import './App.css'

function Mechanic() {
    const [name, setName] = useState("");
    const [mechanicID, setMechanicID] = useState(-1);
    const [assignedJobs, setAssignedJobs] = useState([-1]);

    const recordVehicleDiagnosis = () => {};

    const notifyCost = (cost) => {return};

    const viewAssignedJobs = () => {return assignedJobs};

    const markJobCompleted = (jobID) => {return};

    return (
    <>
        <h1>mechanic</h1>
    </>
    )
}

export default Mechanic
