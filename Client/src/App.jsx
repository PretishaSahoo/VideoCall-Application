import {Route , Routes} from "react-router-dom"
import Lobby from "./Pages/Lobby"
import Room from "./Pages/Room"

function App() {

  return (
    <>
    <div className="App">
      <Routes>
        <Route path="/" element={<Lobby/>}/>
        <Route path="/room/:room" element={<Room/>}/>
      </Routes>
    </div>
    </>
  )
}

export default App
