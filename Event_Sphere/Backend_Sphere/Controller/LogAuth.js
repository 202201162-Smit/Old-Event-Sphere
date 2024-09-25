const College = require('../Models/College');
const CollegeRep = require('../Models/CollegeRep');
const User = require('../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'TeamDoIt';

exports.loginAsCollege = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if both email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the details carefully",
            });
        }

        // Check if the email exists in CollegeRep schema
        let collegeRep = await CollegeRep.findOne({ repId: email }).populate('collegeId');
        if (!collegeRep) {
            return res.status(401).json({
                success: false,
                message: "College representative does not exist",
            });
        }

        // Verify password and generate JWT token
        const payload = {
            email: collegeRep.repId,
            id: collegeRep._id,
            collegeId: collegeRep.collegeId._id,
        };

        if (await bcrypt.compare(password, collegeRep.password)) {
            // Password match
            let token = jwt.sign(payload, JWT_SECRET, {
                expiresIn: "2h",
            });

            collegeRep = collegeRep.toObject();
            collegeRep.token = token;
            collegeRep.password = undefined; // Hide password

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days expiration
                httpOnly: true,
            };

            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                collegeRep,
                message: "College representative logged in successfully",
            });
        } else {
            // Password does not match
            return res.status(403).json({
                success: false,
                message: "Password does not match",
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};

exports.loginAsUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the details carefully",
            });
        }

        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(401).json({
                success: false,
                message: "User does not exist",
            });
        }
        const isPasswordvalid = await userExist.comparePassword(password)
        if(isPasswordvalid){
            const token = await userExist.generateToken()
            return res.status(200).json({message: "Login Successful!!", token, userId: userExist._id.toString()})
        }
        else{
            return res.status(401).json({message: "Invalid email or password"})
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};