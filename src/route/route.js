const express= require("express")
const router = express.Router();

const userController=require('../Controllers/userController')
const bookController=require('../Controllers/bookController')
const middlware=require('../Middleware/auth')
const reviewController=require('../Controllers/reviewController')


//=====================BOOK APIS==================
router.post('/register',userController.createuser)
router.post('/login',userController.loginUser)
router.post('/books',middlware.Authenticate,middlware.AutherizationforCreate,bookController.createBook)
router.get('/books', middlware.Authenticate, bookController.getBooks)
router.get('/books/:bookId',middlware.Authenticate,bookController.getBookById)
router.delete('/books/:bookId',middlware.Authenticate,middlware.Autherization,bookController.deleteBook)
router.put('/books/:bookId',middlware.Authenticate,middlware.Autherization,bookController.updateBook)

//====================REVIEW APIS================
router.post('/books/:bookId/review',reviewController.createReview)
router.put('/books/:bookId/review/:reviewId',reviewController.updateReview)
router.delete('/books/:bookId/review/:reviewId',reviewController.deleteReview)

router.all("/*", async function(req,res){
    return res.status(400).send({status:false,message:"plz check url"})
})


module.exports = router;