import { use, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext.jsx";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { IconButton, Button } from "@mui/material";
import Typography from "@mui/material/Typography";
import { Home } from "@mui/icons-material";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let history = await getHistoryOfUser();
        setMeetings(history);
      } catch (error) {
        //Implement snackbar here
        console.log(error);
      }
    };
    fetchHistory();
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div>
      <IconButton onClick={() => routeTo(`/home`)}>
        <Home />
      </IconButton>
      {meetings.length > 0 ? (
        meetings.map((meeting, idx) => {
          return (
            <Card key={idx} variant="outlined">
              <CardContent>
                <Typography
                  gutterBottom
                  sx={{ color: "text.secondary", fontSize: 14 }}
                >
                  Code : {meeting.meetingCode}
                </Typography>
                <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                  Date : {formatDate(meeting.date)}
                </Typography>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <></>
      )}
    </div>
  );
}
