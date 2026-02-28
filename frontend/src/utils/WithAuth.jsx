import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WithAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {  
        const router = useNavigate();
        const isAuthenticated = () => {
            const token = localStorage.getItem("token");
            // TODO : check if token is valid or not from backend and also setup to check if token is expired or not
            if (token) {
                return true;
            }else{
                return false;
            }
        }
        useEffect(() => {   
            if(!isAuthenticated()){
                router("/auth");
            }
        },[]);
        return <WrappedComponent {...props} />
    };
    return AuthComponent;
};

export default WithAuth;