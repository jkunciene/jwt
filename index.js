const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json());

const users = [
    {
      id: "1",
      username: "john",
      password: "John0908",
      isAdmin: true,
    },
    {
      id: "2",
      username: "jane",
      password: "Jane0908",
      isAdmin: false,
    },
  ];

let refreshTokens = [];

app.post("/api/refresh", (req, res)=> {
    //take the refresh token from the user
    const refreshToken = req.body.token
    //send error if there is no token or it's invalid
    if(!refreshToken) return res.status(401).json("Yuo are not authenticated!");
    if(!refreshTokens.includes(refreshToken)){
        return res.status(403).json("Refresh token is not valid!");
    }
    jwt.verify(refreshToken, "myRefreshKey", (err, user)=> {
        err && console.log(err);
        refreshTokens = refreshTokens.filter(token => token !== refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.push(newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        })
    });
    //if everything is ok, create new access token, refresh token and send to user
});
const generateAccessToken = (user) => {return jwt.sign( { id: user.id, isAdmin: user.isAdmin }, 
            "mySecretKey", 
            { expiresIn: "15min"})  
};

const generateRefreshToken = (user) => {return jwt.sign( { id: user.id, isAdmin: user.isAdmin },
     "myRefreshKey")  
};

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find((findUser) => {
        return findUser.username === username && findUser.password === password;
    });
    
    if(user){
        //generate jwt token
        //jwt payload
        const acsessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            acsessToken,
            refreshToken
        })
    } else{
        res.status(400).json("Username or password incorrect!")
    }
});

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
        //Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE2NzIxMzkxMTV9.hu6dbPmOvzbxyWzi-qtwD3S_WyQENRsOKkDLjxvhigU
        const token = authHeader.split(" ")[1];

        jwt.verify(token, "mySecretKey", (err, user)=>{
            if(err){
                return res.status(403).json("Token is not valid!")
            }

            req.user = user;
            next();
        } )
    } else {
        res.status(401).json("You are not authenticated!")
    }
}

app.delete("/api/users/:userId", verify, (req, res)=> {
    if(req.user.id === req.params.userId || req.user.isAdmin){
        res.status(200).json("User has been deleted.")
    } else {
        res.status(403).json("you are not allowed to delete this user!")
    }
})

app.listen(4000, ()=> console.log('Backend is runnig...'));