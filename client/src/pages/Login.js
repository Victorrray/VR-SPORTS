import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginPage } from "../components/landing/LoginPage.tsx";

export default function Login() {
  const navigate = useNavigate();

  return (
    <LoginPage 
      onBack={() => navigate("/")}
      onSignUp={() => navigate("/signup")}
      onForgotPassword={() => navigate("/forgot-password")}
    />
  );
}
