
import React from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { useState } from "react";
import { Navigate, RouteObject, useNavigate, useRoutes } from "react-router-dom";
import PublicLayOut from "./Component/PublicComponent/PublicLayOut";
import { auth } from "./Firebase/FirebaseConfig";
import Login from "./Component/Login/Login";
import Registration from "./Component/Login/Registration"
import AfterLogin from "./Component/AfterLogin/AfterLogin"
import { GetAuth1 } from "./Redux/Actions/UserAction";
import { useDispatch } from "react-redux";
import TaskShow from "./Component/AfterLogin/TaskShow";

export default function App() {
    let navigate = useNavigate();

  const [UserUid, setUserUid] = useState(auth.currentUser?.uid)
 const dispatch = useDispatch()
  onAuthStateChanged(auth, (currentUser) => {

    if (currentUser!=null) {
      setUserUid(currentUser?.uid)
      dispatch( GetAuth1(currentUser?.uid))
    }
    if (currentUser==null) {
      setUserUid("")
    }
   
  })


  function RequireAuth({ children }: { children: JSX.Element }) {

    if (UserUid == "" ) {
      return <Navigate to="/Login" replace />;
    }
    if (UserUid != "" ) {
     
    }
    return children;
  }
  function LoginTrue({ children }: { children: JSX.Element }) {
    
    if (UserUid != "" ) {
      
      return <Navigate to="/AfterLogin" replace />;
    }
    return children;
  }


  let routes: RouteObject[] = [
    {
      path: "/",
      element: <PublicLayOut />,
      children: [
        { index: true, element: <LoginTrue><Login /></LoginTrue> },
        {
          path: "/Registration",
          element: <Registration />
        },

        {
          path: "/Login",
          element: <LoginTrue><Login /></LoginTrue>
        }
      ]
    },
    { path: "*", element: <p>There's nothing here!</p> },
    {
      path: "/AfterLogin", element: (<RequireAuth><AfterLogin /></RequireAuth>)
    //   children:[
    //     { index: true, element: <TaskShow />},
    //     {
    //       path: "AfterLogin/Task", element: <TaskShow />
    //     }
    //   ]
    }
   
  ];
  let element = useRoutes(routes);
  return (
    <>
    {element}
    </>

  );
}
