import WithAuth from "../utils/WithAuth.jsx";
import { IconButton, Button, TextField } from "@mui/material";
import { Restore} from "@mui/icons-material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { AuthContext } from "../contexts/AuthContext.jsx";

function Home() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }
    return ( 
        <>
            <div className="navBar">
                <div style={{display : "flex", alignItems : "center"}}>
                    <h2>Apna Video Call</h2>
                </div>
                <div style={{display : "flex", alignItems : "center"}}>
                    <IconButton onClick={ ()=>{ navigate("/history"); } }>
                        <Restore/>
                    </IconButton>
                    <p>History</p>
                    <Button onClick={()=>{
                        localStorage.removeItem("token");
                        navigate("/auth");
                    }} >
                        Logout
                    </Button>
                </div>
            </div>
            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Provideing Quality Video Call Just Like Quality Education</h2>
                        <div style={{display : "flex", gap : "10px"}} >
                            <TextField label="Meeting Code" value={meetingCode} onChange={(e) => setMeetingCode(e.target.value)}></TextField>
                            <Button variant="contained" onClick={handleJoinVideoCall} >Join</Button>
                        </div>
                    </div>
                </div>
                <div className="rightPanel">
                    {/* Visit unDraw */}
                    <img src="./logo3.png" alt="" />
                </div>
            </div>
            
        </>
        
     );
}

export default WithAuth(Home);