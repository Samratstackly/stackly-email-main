import './App.css';
import "../src/assets/fonts/fonts.css";
import React from "react";
import ErrorBoundary from './Components/ErrorBoundary';
import { AppRoutes } from './routes/AppRoutes'

function App() {

  return (
    <ErrorBoundary>
      <div className="w-full hide-scrollbar">
        <AppRoutes/>
      </div>
    </ErrorBoundary>
  )
}
export default App;