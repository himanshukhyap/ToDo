import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import Splash from "../components/Splash";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return <Redirect href={user ? "/tasks" : "/login"} />;
}
