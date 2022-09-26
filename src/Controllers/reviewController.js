    const bookModel = require("../Models/bookModel");
    const reviewModel = require("../Models/reviewModel");
    const mongoose=require('mongoose')
    const moment=require('moment')
   
    
    
    
    const isValidObjectId = function (objectId) {
      return mongoose.Types.ObjectId.isValid(objectId)
    }
    
    const isValidRequest=(object)=>{
      return Object.keys(object).length>0
      }
    
    

    const reviewedByRegex=/^[a-zA-Z\. ]*$/
    const ratingRegex=/^[1-5]$/ 
    const reviewedAtRgex =  function (datee){
      return(/^\d{4}-\d{2}-\d{2}$/.test(datee) && datee == moment().format("YYYY-MM-DD"))
    };
   
    //===================================POST API Review===========================================//
      
    const createReview = async function (req, res) {
        try {
          if (isValidRequest(req.query)) return res.status(400).send({ status: false, msg: "Data can passes only through Body" })
    
            let reviewData = req.body;
            const bookId=req.params.bookId
            if(!isValidObjectId(bookId)) return res.status(400).send({status:false,msg:"book ID not valid"})
            let bookbyBookId=await bookModel.findOne({_id:bookId, isDeleted:false})
            if(!bookbyBookId) return res.status(400).send({status:false,msg:`No book exist with this ${bookId} bookId`})
            
            let {reviewedBy,rating, review, reviewedAt}=reviewData 
            // reviewData['reviewedAt']=Date.now()
            reviewData['bookId']=bookId  

            if(!isValidRequest(reviewData)) return res.status(400).send({status: false, msg:"body is empty!"});

            //***************REVIEWED BY VALIDATIONS****************** 
            
            if(!reviewedAt) return res.status(400).send({status:false,message:"reviewedAt is must"})
            if(!reviewedAtRgex(reviewedAt)) return res.status(400).send({staus:false,message:"The format of date should be YYYY-MM-DD and it should currrrent date!!"})
             
            if(!(reviewedByRegex.test(reviewedBy))) return res.status(400).send({status: false, msg:"Please enter valid reviewer's name"});
           
          
            //***************RATING VALIDATIONS******************
            if(!(rating)) return res.status(400).send({status:false,msg:"rating is required"})
             
            if(!(ratingRegex.test(rating))) return res.status(400).send({status: false, msg:"rating should be number from 1 to 5"});
              
            //***************REVIEW VALIDATIONS******************
            if(!review) return res.status(400).send({status:false,msg:"review is invalid"})
    
                
            let saveData = await reviewModel.create(reviewData)
            let updateData= await bookModel.findOneAndUpdate({"_id":bookId},
                {$set:{"reviews":bookbyBookId.reviews+1}}, 
                {new:true})
              
             saveData['isDeleted']=undefined
             saveData['__v']=undefined
             saveData['reviewedAt']=undefined
            
             saveData['updatedAt']=undefined
             updateData._doc['reviewsData']=saveData
            return res.status(201).send({ status: true, msg: "review created successfully", data: updateData });
        } catch (error) {
            return res.status(500).send({ staus: false, msg: error.message })
        }
      };
  

//=====================================Update API REVIEW=============================================//

  const updateReview=async function(req,res){
    try{
            if (isValidRequest(req.query)) return res.status(400).send({ status: false, msg: "Data can passes only through Body" })
        const bookId=req.params.bookId
         if(!isValidObjectId(bookId))
        return res.status(400).send({status:false,msg:"Please enter valid bookId in params"})
       
        let book=await bookModel.findById(bookId)
       
        if(book==null  || book.isDeleted==true){
            return res.status(404).send({status:false,message:"No book found with this bookId or it may be deleted"})
        } 
        //***************ReviewId VALIDATIONS************
        const reviewId=req.params.reviewId
        if(!isValidObjectId(reviewId))
        return res.status(400).send({status:false,msg:"Please enter valid reviewId in params"})
       
        
        const checkreview=await reviewModel.findById(reviewId)
       
        if(checkreview==null || checkreview.isDeleted==true ){
            return res.status(404).send({status:false,message:"No review found with this reviewId or may be it deleted"})
        } 
      
        if((checkreview.bookId).toString() !== bookId){
            return res.status(400).send({status:false,message:"bookId in reviewId is not matches with which you provided"})
        }
       const requestBody=req.body
       if(!isValidRequest(requestBody)){
        return res.status(400).send({status:false,message:"Please enter details for update review"})
       }
    
       let{review, rating,reviewedBy}=requestBody
       let arr=Object.keys(requestBody)
      let idealFilters=["review", "rating", "reviewedBy"]
      
      for(let i=0;i<arr.length;i++){
        if(!(idealFilters.includes(arr[i]))){
          return res.status(400).send({status:false,message:"The body input can be only review, rating, reviewedBy"})
        }
      }
      //******************RATING VALIDATIONS******************** */
       let dataForUpdate={ }
       if(review){

         dataForUpdate.review=review
       }
       if(rating){
        if(!(ratingRegex.test(rating))) return res.status(400).send({status: false, msg:"rating is not in proper format"});
        dataForUpdate.rating=rating
       }
       //****************ReviewedBy VALIDATIONS******************
       if(reviewedBy){
        if(!(reviewedByRegex.test(reviewedBy))) return res.status(400).send({status: false, msg:"reviewed by is not in proper format"});
        dataForUpdate.reviewedBy=reviewedBy
       }
       
       const updatedata=await reviewModel.findByIdAndUpdate(
        {_id:reviewId},///condition
        {$set: dataForUpdate},//updation
        {new:true}).select({isDeleted:0,"__v":0,createdAt:0,updatedAt:0});
        
        const requiredOutput={
            "title": book.title,
             "excerpt":book.excerpt,
            "userId":book.userId,
             "category":book.category,
            "subcategory" :book.subcategory,
            "isDeleted":book.isDeleted,
            "reviews":book.reviews,
            "releasedAt":book.releasedAt,
            "createdAt":book.createdAt,
           "updatedAt":book.updatedAt,
         "reviewsData":updatedata
          }

       return res.status(200).send({status:true,message:"Success",data:requiredOutput})
    }
    catch(err){
        return res.status(500).send({status:false,error:err.message})
    }
    
    }
    
//=====================================DELETE API REVIEW===============================================//
    
    const deleteReview = async function (req, res) {
          try {
            let bookId = req.params.bookId;
           if(!isValidObjectId(bookId)) return res.status(400).send({status:false,message:"Please enter valid bookId in params"})
        
            let book = await bookModel.findById(bookId);
    
            if (book==null || book.isDeleted == true) {
              return res.status(404).send({ status: false, message: `No book exists with ${bookId} bookId or it may be deleted` });
            }
              //*********************ReviewId VALIDATIONS************
            let reviewId = req.params.reviewId; 
            if(!isValidObjectId(reviewId)) return res.status(400).send({status:false,message:"Please enter valid reviewId in params"})
       
            let review = await reviewModel.findById(reviewId);
            
            if (review==null || review.isDeleted === true) {
              return res.status(404).send({ status: false, message: `No review exists with ${reviewId} reviewId or it may be deleted` });
            }
        
            let deletedReview = await reviewModel.updateOne(
              {_id:reviewId },
              { $set:{"isDeleted": true, "deletedAt": new Date()}},
              {new:true }
            );
    
            let updatebook= await bookModel.findOneAndUpdate(
                {_id:bookId},
                {$set:{"reviews":book.reviews-1}}, 
                {new:true})
    
           return res.status(200).send({ status: true,message:"Deleted Successfully" });    
          } catch (error) {
            res.status(500).send({ status: false, Error: error.message });
          }
        };
    
  

module.exports.createReview=createReview
module.exports.updateReview=updateReview
module.exports.deleteReview= deleteReview
