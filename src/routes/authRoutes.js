import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// Register new user 
router.post('/register', (req, res) => {
    try {

        const { username, password } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.exec(`INSERT INTO users(username, password) VALUES('${username}', '${hashedPassword}')`);
        const defaultTodo = 'Hello there! Create your first todo!';
        let lastId = db.prepare(`SELECT last_insert_rowid()`);
        lastId = lastId.run().lastInsertRowid;
        db.exec(`INSERT INTO todos(user_id, task) VALUES('${lastId}', '${defaultTodo}')`)
        const token = jwt.sign({id: lastId}, process.env.JWT_SECRET, {expiresIn: '24h'}); 
        res.json({token: token});

        // res.send("Registeration successful!");
    }
    catch (err) {
        console.log(err);
        res.sendStatus(404);
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    try {
        let user = db.prepare(`SELECT * FROM users WHERE username = ?`);
        user = user.get(username);
        // if the user is not found return from the function
        if (!user) {
            return res.status(404).send({message: "User not found!"});
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        // if the password is invalid return from the function
        if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid password!" });
        }

        // we have a successful auhentication
        // console.log(user);
        const token = jwt.sign({id:user.id}, process.env.JWT_SECRET, {expiresIn: '24h'});
        res.json({"token": token});


    }
    catch (err) {
        console.log(err);
        res.sendStatus(503);
    }

});

export default router;