const express = require('express');
require('dotenv').config();
const app = express();
const jwt =require('jsonwebtoken');
const cors=require('cors');
const port=process.env.PORT || 5000;

const ObjectId=require('mongodb').ObjectId;
app.use(cors());
app.use(express.json());

const stripe = require("stripe")('sk_test_51L1SOQLuxFo5xZT5eOSLorfECkcOzFvjMnNyOyhygrzbgNDXMruVg34VdF5jUFAar9et00usGC2IPPeJLIfITYCW00x3q4z8Cm');


// assignment-12
// Ii5O5V7yViq1ErG6


function verifyJwt(req,res,next){
  const authheader=req.headers.authorization;
  if(!authheader){
   return res.status(401).send({message:'unauthorize access'});
 }
 const token =authheader.split(' ')[1];
   jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
     if(err){
       return res.status(403).send({message:'Forbined access'});
     }
     console.log('decodeed',decoded);
     req.decoded=decoded;
     next();
   })

}


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sursn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
   await client.connect();
   const userCollection= client.db("product").collection("user"); 
   const productsCollection= client.db("product").collection("products"); 
   const reviewCollection= client.db("product").collection("review"); 
   const orderCollection= client.db("product").collection("order");
   const paymentCollection= client.db("product").collection("payment");

    const VerifyAdmin = async (req,res,next)=>{
    const requester=req.decoded.email;
    const requesterSccount=await userCollection.findOne({email:requester})
  
    if(requesterSccount.role=== 'admin'){
      next();

    }
    else{
      res.status(403).send({message:'Forbidden'});
    }

   }


  app.get('/user',async(req,res)=>{
    const query= {} ;
    const cursor= userCollection.find(query);
    const users=await cursor.toArray();
    res.send(users)
   })

   // only for admin
app.get('/admin/:email',async(req,res)=>{
  const email=req.params.email;
   const user=await userCollection.findOne({email:email});
   const isAdmin=user.role==='admin';
   res.send({admin:isAdmin})
})
   

app.put('/user/admin/:email',verifyJwt,VerifyAdmin,async(req,res)=>{
  const email=req.params.email;
    const filter={email:email};
    const updateDoc={
      $set:{role:'admin'},
    };
    const result=await userCollection.updateOne(filter,updateDoc);
    res.send(result);

})








   app.post('/create-payment-intent', async (req, res) => {
    const service = req.body;
    const price=service.price;
    const amount = price*100;
    const paymentIntent = await stripe.paymentIntents.create({
      amount:amount,
      currency: 'usd',
     payment_method_types:['card']
    
    });
    res.send({clientSecret: paymentIntent.client_secret})

  });



  //  review
   app.post('/review',async(req,res) =>{
    const newReview =req.body;
    const result = await reviewCollection.insertOne(newReview);
   console.log(`A document was inserted with the _id: ${result.insertedId}`);
    res.send(result);
  });

  app.get('/review',async(req,res)=>{
    const query= {} ;
    const cursor= reviewCollection.find(query);
    const users=await cursor.toArray();
    res.send(users)
   })



// order
app.get('/order',async(req,res)=>{
  const query= {} ;
  const cursor= orderCollection.find(query);
  const users=await cursor.toArray();
  res.send(users)
 })

app.post('/order',async(req,res) =>{
  const newReview =req.body;
  const result = await orderCollection.insertOne(newReview);
 console.log(`A document was inserted with the _id: ${result.insertedId}`);
  res.send(result);
});

app.get('/myorder',verifyJwt,async(req,res)=>{
  const decodedEmail=req.decoded.email;
  // from ul 
  const email=req.query.email;
  if(email === decodedEmail){
      // cmper mongo = ul
      const query={email:email};
      const booking=await orderCollection.find(query).toArray();
      res.send(booking);
  }
  else{
    res.status(403).send({message:'forbidden accces!'})
  }

})

app.get('/myorder/:id',async(req,res) =>{
  const id=req.params.id;
  const query={_id:ObjectId(id)};
  const product=await orderCollection.findOne(query);
  res.send(product);
})

app.patch('/myorder/:id',async(req,res) =>{
  const id=req.params.id;
  const payment=req.body;
  const query={_id:ObjectId(id)};
  const updateDoc={
    $set:{
      paid:true,
      paymentid:payment.tranjectionId
    }
  }
  const updated=await orderCollection.updateOne(query,updateDoc);
  const result =await paymentCollection.insertOne(payment);
  res.send(updateDoc);

})

app.patch('/updatePayment/:id',async(req,res) =>{
  const id=req.params.id;
  const query={_id:ObjectId(id)};
  const updateDoc={
    $set:{
      approved:true,
    }
  }
  const updated=await orderCollection.updateOne(query,updateDoc);
  res.send(updateDoc);

})

    app.delete('/myorder/:id', async(req,res) =>{
      const id=req.params.id;
      const query={_id:ObjectId(id)};
      const result= await orderCollection.deleteOne(query);
      res.send(result);
    });




// product
   app.get('/products',async(req,res)=>{
    const query= {} ;
    const cursor= productsCollection.find(query);
    const users=await cursor.toArray();
    res.send(users)
   })

   app.get('/products/:id',async(req,res) =>{
    const id=req.params.id;
    const query={_id:ObjectId(id)};
    const product=await productsCollection.findOne(query);
    res.send(product);
  })

  app.post('/products',async(req,res) =>{
    const newproduct =req.body;
    const result = await productsCollection.insertOne(newproduct);
   console.log(`A document was inserted with the _id: ${result.insertedId}`);
    res.send(result);
  });

  app.delete('/products/:id', async(req,res) =>{
    const id=req.params.id;
    const query={_id:ObjectId(id)};
    const result= await productsCollection.deleteOne(query);
    res.send(result);
  });


  app.put('/updateQunty',async (req,res)=>{
    const id=req.body.id;
    const newQnty=parseInt(req.body.quantity)
    console.log(newQnty); 
    const filter={_id:ObjectId(id)};
    const opation = {upsert:true};
    const updateDoc ={
      $set:{
        available:newQnty,
      },
    };
    const result = await productsCollection.updateOne(filter,updateDoc,opation);
    res.send(result);

  })


  app.put('/profiledata/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email};
    const newdata=req.body;
    const opations={upsert:true};
    const updateDoc={
      $set:newdata,
    };
    const result=await userCollection.updateOne(filter,updateDoc,opations);
    res.send(result);
  })


  app.get('/profiledata',verifyJwt,async(req,res)=>{
    const decodedEmail=req.decoded.email;
    // from ul 
    const email=req.query.email;
    console.log('aaa',email);
    if(email === decodedEmail){
        // cmper mongo = ul
        const query={email:email};
        const booking=await userCollection.find(query).toArray();
        console.log('aaa',booking);
        res.send(booking);
    }
    else{
      res.status(403).send({message:'forbidden accces!'})
    }
  
  })

//Login user
 app.put('/user/:email',async(req,res)=>{
   const email=req.params.email;
   const user=req.body;
   const filter={email:email};
   const opations={upsert:true};
   const updateDoc={
     $set:user,
   };

   const result=await userCollection.updateOne(filter,updateDoc,opations);
   const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{
    expiresIn: '1d'
  });
   res.send({result,token});

 })
 
  }
  finally{
   //  awite client .close();
  }
}
run().catch(console.dir);





app.get('/',(req,res) =>{
  res.send('12 Node runing!!!')
})

app.listen(port,() =>{
  console.log('assignment 12 is runing!!!',port)
})