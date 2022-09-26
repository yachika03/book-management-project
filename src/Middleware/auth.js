const jwt = require("jsonwebtoken")

const bookModel = require("../Models/bookModel")

const userModel=require("../Models/userModel")
const mongoose = require("mongoose");

const Authenticate = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"]

        if (!token) return res.status(400).send({ status: false, msg: "Token must be present in the request header" })

        jwt.verify(token, "Group34-Project-BookManagment", (error, decodedToken) => {
            if (error) {
                return res.status(401).send({ status: false, error:error.message })
            }
            else {
                req.decodedToken = decodedToken
                next()
            }
        })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
const Autherization = async function (req, res, next) {
    try {
        const bookId = req.params["bookId"]
        if(!bookId) return res.status(400).send({status:false,msg:"bookId is must"})
        if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "bookId is invalid" });
        const decodedToken = req.decodedToken
        const bookbyBookId = await bookModel.findOne({ _id: bookId, isDeleted: false})
        if (!bookbyBookId) return res.status(404).send({ status: false, msg: `no books found by ${bookId}` })
        if (decodedToken.userId != bookbyBookId.userId) return res.status(403).send({ status: false, message: "unauthorize access" });
        next()
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId)
  }

const AutherizationforCreate = async function (req, res, next) {
    try {
        //***********USERID VALIDATION************ */
       const userId=req.body.userId
       if(!userId) return res.status(400).send({status:false,msg:"userId is must"})
       if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" });
       const decodedToken = req.decodedToken
       const userbyuserId= await userModel.findOne({"_id": userId, isDeleted: false})
       if(!userbyuserId){
        return res.status(400).send({status:false,message:`Enter valid userId ${userId}, userId does not found`})
       }
       //************AUTHORIZATION**************
        if (decodedToken.userId !=userbyuserId._id) return res.status(403).send({ status: false, message: "unauthorize access" });
        next()
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { Authenticate, Autherization, AutherizationforCreate}