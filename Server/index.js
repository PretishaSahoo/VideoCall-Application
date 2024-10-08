const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors({
    origin: "*",
    methods: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Server");
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*" 
    }
});

const emailToSocketIdMap = new Map() ;
const SocketIdToEmailMap = new Map() ;

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on("room:join" , data=>{
    const {email , room} = data ;
    emailToSocketIdMap.set(email , socket.id);
    SocketIdToEmailMap.set(socket.id , email);
    io.to(room).emit("user:joined" , {email , id:socket.id});
    socket.join(room)
    io.to(socket.id).emit("room:join" , data);
  })

  socket.on("user:call" , ({to , offer})=>{
    io.to(to).emit("incoming:call" , {from :socket.id , offer})
  })

  socket.on("call:accepted" , ({to , ans})=>{
    io.to(to).emit("call:accepted" , {from :socket.id , ans})
  })

  socket.on("peer:nego:needed" , ({to , offer}) =>{
    io.to(to).emit("peer:nego:needed" , {from :socket.id  , offer})
  })

  socket.on("peer:nego:done" , ({to,ans})=>{
    io.to(to).emit("peer:nego:final" , {from :socket.id  , ans})
  })

  socket.on("disconnect", () => {
    const email = SocketIdToEmailMap.get(socket.id);
    if (email) {
      emailToSocketIdMap.delete(email);
      SocketIdToEmailMap.delete(socket.id);
      console.log(`Socket Disconnected: ${socket.id} (Email: ${email})`);
    }
  });

  socket.on("error", (err) => {
    console.error(`Socket error on ${socket.id}:`, err);
  });

  socket.on("room:leave", (data) => {
    const { email, room } = data;

    emailToSocketIdMap.delete(email);
    SocketIdToEmailMap.delete(socket.id);

    socket.leave(room);
    io.to(room).emit("user:left", { email, id: socket.id });
    
    console.log(`User left the room: ${email} (Socket ID: ${socket.id})`);
});

});


server.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});