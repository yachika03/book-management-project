const bookModel = require("../Models/bookModel");
const userModel = require("../Models/userModel");
const reviewModel = require("../Models/reviewModel");
const mongoose = require("mongoose");
const moment=require('moment')

//========/validation functions/=============//

const isValidString = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};


const isValidObjectId = (ObjectId) => {
  return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidRequest = function (object) {
  return Object.keys(object).length > 0;
};

//========validation regex==============//

const stringRegex = /^[a-zA-Z\. ]*$/;
const ISBNregex = /^[6-9]{3}\-([\d]{10})$/;
const releasedAtRgex =  function (datee){
  return(/^\d{4}-\d{2}-\d{2}$/.test(datee) && moment(datee,"YYYY-MM-DD").isValid())
};

//=====================================Create Book Api=====================================//
const createBook = async function (req, res) {
  try {
    if (isValidRequest(req.query))
      return res
        .status(400)
        .send({ status: false, message: "Data can passes only through Body" });
    const bookData = req.body;
    if (!isValidRequest(bookData))
      return res.status(400).send({ status: false, message: "body is empty" });
    const { title, excerpt, userId, category, subcategory, ISBN, releasedAt } =
      bookData;
    

    //*********Title VALIDATIONS*******************
    if (!isValidString(title))
      return res
        .status(400)
        .send({ status: false, message: "title is mandatory and valid" });
    if (!stringRegex.test(title))
      return res
        .status(400)
        .send({ status: false, message: "title can conatin only alphabets" });

    const titleData = await bookModel.findOne({ title: title });
    if (titleData)
      return res
        .status(400)
        .send({ status: false, message: "title already exist " });

    //***********Excerpt VALIDATIONS****************

    if (!isValidString(excerpt))
      return res
        .status(400)
        .send({ status: false, message: "excerpt is mandatory and valid" });
    
    //***********Category VALIDATIONS****************

    if (!isValidString(category))
      return res
        .status(400)
        .send({ status: false, message: "category is mandatory and valid" });
    if (!stringRegex.test(category))
      return res
        .status(400)
        .send({
          status: false,
          message: "category can conatin only alphabets",
        });
//***********SubCategory VALIDATIONS*****************
    if (!isValidString(subcategory))
      return res
        .status(400)
        .send({ status: false, message: "subcategory is mandatory and valid" });
    if (!stringRegex.test(subcategory))
      return res
        .status(400)
        .send({
          status: false,
          message: "subcategory can conatin only alphabets",
        });

    //**********Reviews Validations*********************

    if (bookData.reviews) {
      if (bookData.reviews !== 0)
        return res
          .status(400)
          .send({
            status: false,
            message: "reviews should not be greater than zero or less than",
          });
    }
    //***********ISBN Validations***********************

    if (!bookData.ISBN)
      return res
        .status(400)
        .send({ status: false, message: "ISBN not present" });

    if (!ISBNregex.test(ISBN))
      return res
        .status(400)
        .send({ status: false, message: " ISBN is not in proper format" });
    const ISBNalreadyused = await bookModel.findOne({ ISBN: ISBN });
    if (ISBNalreadyused)
      return res
        .status(400)
        .send({ status: false, message: "ISBN already used" });

    //***********releasedAt Validations********************
    if (!releasedAtRgex(releasedAt))
      return res
        .status(400)
        .send({
          status: false,
          message: "releasedAt is mandatory and must have valid yyyy-mm-dd format only",
        });

    const saveData = await bookModel.create(bookData);
    return res
      .status(201)
      .send({
        status: true,
        message: "book created successfully",
        data: saveData,
      });
  } catch (error) {
    return res.status(500).send({ staus: false, error: error.message });
  }
};


//====================================GET BOOK API============================================//

const getBooks = async function (req, res) {
  try {
    if (isValidRequest(req.body))
      return res
        .status(400)
        .send({
          status: false,
          message: "filters can pass only through query params",
        });
    const queryParams = req.query;
  
    let filterCondition = { isDeleted: false };
    if (isValidRequest(queryParams)) {
      const { userId, category, subcategory } = queryParams;
      
      let arr=Object.keys(queryParams)
      let idealFilters=["userId", "category", "subcategory"]
      
      for(let i=0;i<arr.length;i++){
        if(!(idealFilters.includes(arr[i]))){
          return res.status(400).send({status:false,message:"The filters can be only userId, category, subcategory"})
        }
      }
      //****************USERID VALIDATIONS************************
      if (queryParams.hasOwnProperty("userId")) {
        if (!isValidObjectId(userId))
          return res
            .status(400)
            .send({ status: false, message: "Enter a valid userId" });
        const userByUserId = await userModel.findById(userId);
        if (!userByUserId)
          return res
            .status(400)
            .send({ status: false, message: "no author found" });
        filterCondition["userId"] = userId;
      }
      //******************CATEGORY VALIDATIONS*******************
      if (queryParams.hasOwnProperty("category")) {
        if (!isValidString(category))
          return res
            .status(400)
            .send({
              status: false,
              message: "book category should be in valid format",
            });
        filterCondition["category"] = category.trim();
      }
      //********************SUBCATEGORY VALIDATIONS****************
      if (queryParams.hasOwnProperty("subcategory")) {
        if (!isValidString(subcategory))
          return res
            .status(400)
            .send({
              status: false,
              message: "book subcategory must in valid format",
            });
        filterCondition["subcategory"] = subcategory.trim();
      }
      const filetredBooks = await bookModel
        .find(filterCondition)
        .select({
          ISBN: 0,
          createdAt: 0,
          updatedAt: 0,
          isDeleted: 0,
          subcategory: 0,
          __v: 0,
          deletedAt: 0,
        });

      if (filetredBooks.length == 0)
        return res
          .status(404)
          .send({ status: false, message: "no books found" });

      return res
        .status(200)
        .send({
          status: true,
          message: "filtered book list",
          booksCount: filetredBooks.length,
          bookList: filetredBooks.sort((a, b) =>
            a.title.localeCompare(b.title)
          ),
        });
    } else {
      const allBooks = await bookModel
        .find(filterCondition)
        .select({
          ISBN: 0,
          createdAt: 0,
          updatedAt: 0,
          isDeleted: 0,
          subcategory: 0,
          __v: 0,
          deletedAt: 0,
        });
       
      if (allBooks.length == 0)
        return res
          .status(404)
          .send({ status: false, message: "no books found" });

      return res
        .status(200)
        .send({
          status: true,
          message: "book list",
          booksCount: allBooks.length,
          booksList: allBooks.sort((a, b) =>
          a.title.localeCompare(b.title)
        ),
        });
    }
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

//==============================GET BOOK BI API=============================================//
const getBookById = async function (req, res) {
  try {
    const bookId = req.params.bookId;
    if (!isValidObjectId(bookId))
      return res
        .status(400)
        .send({
          status: false,
          message: "Please enter valid bookId in params",
        });
    let book = await bookModel.findById(bookId);
    if (book == null || book.isDeleted == true) {
      return res
        .status(404)
        .send({
          status: false,
          message: "No book found with this bookId or it may be deleted",
        });
    }
    const filter = {
      bookId: bookId,
      isDeleted: false,
    };
    const review = await reviewModel
      .find(filter)
      .select({ isDeleted: 0, __v: 0, createdAt: 0, updatedAt: 0 });
    const requiredOutput = {
      title: book.title,
      excerpt: book.excerpt,
      userId: book.userId,
      category: book.category,
      subcategory: book.subcategory,
      isDeleted: book.isDeleted,
      reviews: book.reviews,
      releasedAt: book.releasedAt,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      reviewsData: review,
    };

    return res
      .status(200)
      .send({ status: true, message: "Book Data", data: requiredOutput });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

//=============================UPDATE API=====================================================//

const updateBook = async function (req, res) {
  try {
    const bookId = req.params.bookId;
    if (!isValidObjectId(bookId))
      return res
        .status(400)
        .send({
          status: false,
          message: "Please enter valid bookId in params",
        });
    const checkBook = await bookModel.findById(bookId);
    if (checkBook == null || checkBook.isDeleted == true) {
      return res
        .status(404)
        .send({
          status: false,
          message: "No book found with this bookId or may be book is deleted",
        });
    }
    const bodyData = req.body;
    if (!isValidRequest(bodyData)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please enter filters for update book",
        });
    }
    const { title, excerpt, releasedAt, ISBN } = bodyData;
    let arr=Object.keys(bodyData)
      let idealFilters=["title", "excerpt", "releasedAt", "ISBN"]
      
      for(let i=0;i<arr.length;i++){
        if(!(idealFilters.includes(arr[i]))){
          return res.status(400).send({status:false,message:"The body input can be only title, excerpt, releasedAt, ISBN"})
        }
      }
    let dataForUpdate = {};

    //****************TITLE VALIDATIONS**************
    if (title) {
      if (!stringRegex.test(title))
        return res
          .status(400)
          .send({ status: false, message: "title can conatin only alphabets" });
      const checktitle = await bookModel.findOne({ title: title });
      if (checktitle)
        return res
          .status(400)
          .send({
            status: false,
            message:
              "A book with this title already present, Use another title",
          });
      dataForUpdate.title = title;
    }
    //*******************ISBN VALIDATIONS**********
    if (ISBN) {
      if (!ISBNregex.test(ISBN))
        return res
          .status(400)
          .send({ status: false, message: " ISBN is not in proper format" });
      const checkISBN = await bookModel.findOne({ ISBN: ISBN });
      if (checkISBN)
        return res
          .status(400)
          .send({
            status: false,
            message: "A book with this ISBN already present, Use another ISBN",
          });
      dataForUpdate.ISBN = ISBN;
    }
    //***********EXCERPT VALIDATIONS******************
    if (excerpt) {
      dataForUpdate.excerpt = excerpt;
    }
    if (releasedAt) {
      if (!releasedAtRgex.test(releasedAt))
        return res
          .status(400)
          .send({
            status: false,
            message: "releasedAt is mandatory and have yyyy-mm-dd format only",
          });
      dataForUpdate.releasedAt = releasedAt;
    }
    dataForUpdate.isDeleted = false;

    const updatebk = await bookModel.findByIdAndUpdate(
      { _id: bookId }, //filters
      { $set: dataForUpdate },
      { new: true }
    );

    return res
      .status(200)
      .send({ status: true, message: "Updated Sucessfully", data: updatebk });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

//===========================DELETE API===================================================//
const deleteBook = async function (req, res) {
  try {
    let reqbody = req.body;
    if (isValidRequest(reqbody))
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    let reqquery = req.query;
    if (isValidRequest(reqquery))
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    let bookId = req.params.bookId;
    if (!isValidObjectId(bookId))
      return res
        .status(400)
        .send({ status: false, message: `${id} is not a valid bookId` });
    let bookbyBookId = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
    });
    if (!bookbyBookId)
      return res
        .status(400)
        .send({ status: false, message: `no bOOK found by ${bookId}` });
    await bookModel.findByIdAndUpdate(
      { _id: bookId },
      { $set: { isDeleted: true, deletedAt: Date.now() } },
      { new: true }
    );
    return res
      .status(200)
      .send({ status: true, message: "book deleted successfully" });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};


module.exports.createBook = createBook;
module.exports.getBooks = getBooks;
module.exports.deleteBook = deleteBook;
module.exports.getBookById = getBookById;
module.exports.updateBook = updateBook;
