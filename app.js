const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET =
    "hvdvay6ert72839289()aiyg8541224293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";

const password = encodeURIComponent("Sameers12@");
const mongoUrl = `mongodb+srv://Sameer1201:${password}@user-admin-panel.zu16cnm.mongodb.net/?retryWrites=true&w=majority&appName=User-admin-panel`;


mongoose
    .connect(mongoUrl, {

    })
    .then(() => {
        console.log("Connected to database");
    })
    .catch((e) => console.log(e));

require("./userDetails");
// require("./imageDetails");

const User = mongoose.model("UserInfo");
// const Images = mongoose.model("ImageDetails");
app.post("/register", async (req, res) => {
    const { name, username, email, password, userType } = req.body;

    if (!name || !username || !email || !password || !userType) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.json({ error: "User Exists" });
        }
        await User.create({
            name,
            username,
            email,
            password: encryptedPassword,
            userType,
        });
        res.send({ status: "ok" });
    } catch (error) {
        res.send({ status: "error" });
    }
});


app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ error: "User Not found" });
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ email: user.email }, JWT_SECRET, {
            expiresIn: "60m",
        });

        if (res.status(201)) {
            return res.json({ status: "ok", data: token });
        } else {
            return res.json({ error: "error" });
        }
    }
    res.json({ status: "error", error: "Invalid Password" });
});

app.post("/userData", async (req, res) => {
    const { token } = req.body;
    try {
        const user = jwt.verify(token, JWT_SECRET, (err, res) => {
            if (err) {
                return "token expired";
            }
            return res;
        });
        console.log(user);
        if (user === "token expired") {
            return res.send({ status: "error", data: "token expired" });
        }

        const useremail = user.email;
        User.findOne({ email: useremail })
            .then((data) => {
                res.send({ status: "ok", data: data });
            })
            .catch((error) => {
                res.send({ status: "error", data: error });
            });
    } catch (error) { }
});

app.listen(5000, () => {
    console.log("Server Started");
});

const createUser = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
        });

        const data = await response.json();
        if (data.status === "ok") {
            alert("User created successfully!");
            setCreateUserOpen(false);
            setNewUser({ name: "", username: "", email: "", password: "", userType: "" });
            getAllUser(); // Refresh user data after creation
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Error creating user:", error);
        alert("An error occurred. Please try again.");
    }
};

app.get("/getAllUser", async (req, res) => {
    let query = {};
    const searchData = req.query.search;
    if (searchData) {
        query = {
            $or: [
                { name: { $regex: searchData, $options: "i" } },
                { email: { $regex: searchData, $options: "i" } },
            ],
        };
    }

    try {
        const allUser = await User.find(query);
        res.send({ status: "ok", data: allUser });
    } catch (error) {
        console.log(error);
    }
});

app.post("/deleteUser", async (req, res) => {
    const { userid } = req.body;
    try {
        const deletionResult = await User.deleteOne({ _id: userid });
        if (deletionResult.deletedCount === 1) {
            res.send({ status: "Ok", data: "Deleted" });
        } else {
            res.send({ status: "error", data: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.send({ status: "error", data: error.message });
    }
});



app.post("/upload-image", async (req, res) => {
    const { base64 } = req.body;
    try {
        await Images.create({ image: base64 });
        res.send({ Status: "ok" });
    } catch (error) {
        res.send({ Status: "error", data: error });
    }
});

app.post("/createAdminUser", async (req, res) => {
    const { name, username, email, password, userType, secretKey } = req.body;

    if (!name || !username || !email || !password || !userType || !secretKey) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (userType !== "Admin") {
        return res.status(403).json({ error: "Only Admin can create users" });
    }

    if (secretKey !== "Admin1201") {
        return res.status(403).json({ error: "Invalid Admin Secret Key" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.json({ error: "User Exists" });
        }
        await User.create({
            name,
            username,
            email,
            password: encryptedPassword,
            userType,
        });
        res.send({ status: "ok" });
    } catch (error) {
        res.send({ status: "error" });
    }
});



app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            return res.json({ status: "User Not Exists!!" });
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign(
            { email: oldUser.email, id: oldUser._id },
            secret,
            {
                expiresIn: "5m",
            }
        );
        const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: "camden16@ethereal.email",
                pass: "p3NMzdQESC3nGeY48S",
            },
        });

        const mailOptions = {
            from: "youremail@gmail.com",
            to: "coolboysam535@gmail.com",
            subject: "Password Reset",
            text: link,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.json({ Status: "Error sending email" });
            } else {
                console.log("Email sent: " + info.response);
                return res.send({ Status: "Success" });
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "Something went wrong" });
    }
});

app.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", { email: verify.email, status: "Not Verified" });
    } catch (error) {
        console.log(error);
        res.send("Not Verified");
    }
});

app.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );

        res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
        console.log(error);
        res.json({ status: "Something Went Wrong" });
    }
});

