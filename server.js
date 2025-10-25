import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Validate required environment variables
if (!process.env.PORT) {
  console.error("❌ PORT environment variable is required");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is required");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is required");
  process.exit(1);
}

const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Return Schema
const returnSchema = new mongoose.Schema({
  ptin: { type: String, required: true },
  name: { type: String, required: true },
  division: { type: String, required: true },
  circle: { type: String, required: true },
  professionType: { type: String, required: true },
  taxPeriod: { type: String, required: true },
  returnType: { type: String, required: true },
  returnDetails: [{
    payRange: { type: String, required: true },
    taxRate: { type: Number, required: true },
    employeeCount: { type: Number, required: true },
    taxPayable: { type: Number, required: true }
  }],
  totalPayable: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const Return = mongoose.model('Return', returnSchema);

/* ---------------------- Annexure 1 - Dealers ---------------------- */
const dealers = [
  { ptin: "36123456001", password: "User@001", name: "Suhani pvt ltd.", division: "L B Nagar", circle: "Uppal" },
  { ptin: "36123456002", password: "User@002", name: "Hindustan Packages pvt.ltd", division: "L B Nagar", circle: "Uppal" },
  { ptin: "36123456003", password: "User@003", name: "Ayush pvt. Ltd.", division: "L B Nagar", circle: "Uppal" },
  { ptin: "36123456004", password: "User@004", name: "Shrishti Electromech pvt ltd", division: "L B Nagar", circle: "Uppal" },
  { ptin: "36123456005", password: "User@005", name: "Jaguar Solutions Pvt .ltd", division: "Secunderabad Zone", circle: "Begumpet" },
  { ptin: "36123456006", password: "User@006", name: "Dayalan pvt ltd", division: "Secunderabad Zone", circle: "Begumpet" },
  { ptin: "36123456007", password: "User@007", name: "Hindorson pvt ltd", division: "Secunderabad Zone", circle: "Begumpet" },
  { ptin: "36123456008", password: "User@008", name: "Lekhya pvt ltd", division: "Secunderabad Zone", circle: "Begumpet" },
  { ptin: "36123456009", password: "User@009", name: "I.N Roy pvt ltd", division: "Khairatabad Zone", circle: "Jubilee hills" },
  { ptin: "36123456010", password: "User@010", name: "Dayakar pvt ltd", division: "Khairatabad Zone", circle: "Jublie hills" },
  { ptin: "36123456011", password: "User@011", name: "Hinduja pvt ltd", division: "Khairatabad Zone", circle: "Jublie hills" },
  { ptin: "36123456012", password: "User@012", name: "G V R pvt ltd", division: "Kukatpally Zone", circle: "Moosapet" },
  { ptin: "36123456013", password: "User@013", name: "Wol 3D India pvt ltd", division: "Kukatpally Zone", circle: "Moosapet" },
  { ptin: "36123456014", password: "User@014", name: "Karthik pvt ltd", division: "Kukatpally Zone", circle: "Moosapet" },
  { ptin: "36123456015", password: "User@015", name: "Godrej pvt ltd", division: "Kukatpally Zone", circle: "Moosapet" },
];

/* ---------------------- Annexure 2 - Banks ---------------------- */
const bankAccounts = [
  { bank: "State Bank of India", accountNo: "6785 4367 3593 5479", userId: "Raman Kumar", password: "Sinha@897" },
  { bank: "Bank of Baroda", accountNo: "6433 3489 2795 6839", userId: "Prasad Shetty", password: "Shetty_585" },
  { bank: "Punjab National Bank", accountNo: "4638 5467 5389 5346", userId: "Vinod Kumar", password: "Kumar$999" },
  { bank: "Axis Bank", accountNo: "5643 7532 7567 4568", userId: "Shrishti", password: "Shrishti*765" },
];

/* ---------------------- JWT helper ---------------------- */
const generateToken = (user) => {
  return jwt.sign({ ptin: user.ptin, name: user.name }, JWT_SECRET, {
    expiresIn: "2h",
  });
};

/* ---------------------- Routes ---------------------- */

// Home
app.get("/", (req, res) => {
  res.send("✅ PTR-Sreedhar Backend is running...");
});

// Login
app.post("/api/login", (req, res) => {
  const { ptin, password } = req.body;

  const user = dealers.find((d) => d.ptin === ptin && d.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid PTIN or password" });
  }

  const token = generateToken(user);
  res.json({
    message: "Login successful ✅",
    token,
    user: {
      ptin: user.ptin,
      name: user.name,
      division: user.division,
      circle: user.circle,
    },
  });
});

// Verify Token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// Token validation endpoint
app.get("/api/validate-token", verifyToken, (req, res) => {
  // If we reach here, token is valid
  res.json({ 
    valid: true, 
    user: req.user,
    message: "Token is valid" 
  });
});

// Fetch dealer info (protected)
app.get("/api/dealer-info", verifyToken, (req, res) => {
  const dealer = dealers.find((d) => d.ptin === req.user.ptin);
  if (!dealer) return res.status(404).json({ message: "Dealer not found" });
  res.json(dealer);
});

// Get dealer info by PTIN (for E-Payment auto-fill)
app.get("/api/dealer-by-ptin/:ptin", verifyToken, (req, res) => {
  const { ptin } = req.params;
  const dealer = dealers.find((d) => d.ptin === ptin);
  
  if (!dealer) {
    return res.status(404).json({ message: "Dealer not found for this PTIN" });
  }
  
  // Return only public info (no password)
  res.json({
    ptin: dealer.ptin,
    name: dealer.name,
    division: dealer.division,
    circle: dealer.circle
  });
});

// Bank details route
app.get("/api/bank-details", verifyToken, (req, res) => {
  res.json(bankAccounts);
});

// Submit return route
app.post("/api/submit-return", verifyToken, async (req, res) => {
  try {
    const returnData = req.body;
    
    // Validate required fields
    if (!returnData.ptin || !returnData.taxPeriod || !returnData.returnDetails) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Create new return document
    const newReturn = new Return({
      ptin: returnData.ptin,
      name: returnData.name,
      division: returnData.division,
      circle: returnData.circle,
      professionType: returnData.professionType,
      taxPeriod: returnData.taxPeriod,
      returnType: returnData.returnType,
      returnDetails: returnData.returnDetails,
      totalPayable: returnData.totalPayable,
      submittedAt: new Date(returnData.submittedAt)
    });
    
    // Save to MongoDB
    const savedReturn = await newReturn.save();
    
    // Return saved successfully
    
    res.json({
      message: "Return submitted successfully",
      returnId: savedReturn._id,
      submittedAt: savedReturn.submittedAt
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to save return to database",
      error: error.message 
    });
  }
});

// Get returns for a specific user
app.get("/api/returns", verifyToken, async (req, res) => {
  try {
    const returns = await Return.find({ ptin: req.user.ptin })
      .sort({ submittedAt: -1 })
      .limit(50); // Get last 50 returns
    
    res.json({
      message: "Returns retrieved successfully",
      returns: returns,
      count: returns.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch returns",
      error: error.message 
    });
  }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  ptin: { type: String, required: true },
  name: { type: String, required: true },
  taxType: { type: String, required: true },
  purpose: { type: String, required: true },
  taxPeriodFrom: { type: String, required: true },
  taxPeriodTo: { type: String, required: true },
  amount: { type: Number, required: true },
  remarks: { type: String },
  date: { type: String, required: true },
  ctdTransactionId: { type: String, required: true }, // CTD Transaction ID (14-digit starting with 36)
  submittedAt: { type: Date, default: Date.now }
});

// Transaction Success Schema - stores completed payment transactions
const transactionSuccessSchema = new mongoose.Schema({
  ptin: { type: String, required: true },
  name: { type: String, required: true },
  taxType: { type: String, required: true },
  purpose: { type: String, required: true },
  taxPeriodFrom: { type: String, required: true },
  taxPeriodTo: { type: String, required: true },
  amount: { type: Number, required: true },
  remarks: { type: String },
  date: { type: String, required: true },
  
  // Bank transaction details
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolder: { type: String, required: true },
  
  // Transaction references
  challanNo: { type: String, required: true },
  ddocode: { type: String, required: true },
  hoa: { type: String, required: true },
  bankRef: { type: String, required: true },
  crn: { type: String, required: true },
  etaxPaymentReference: { type: String }, // E-Tax Payment Reference
  paymentId: { type: String }, // Payment ID for tracking
  
  // Document display values
  merchantName: { type: String, default: "Telangana" },
  typeOfTax: { type: String, default: "Telangana Commercial Tax" },
  
  // Status and timestamps
  transactionStatus: { type: String, default: "Completed" },
  bankTimestamp: { type: Date, required: true },
  completedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);
const TransactionSuccess = mongoose.model('TransactionSuccess', transactionSuccessSchema);

// Submit payment route
app.post("/api/submit-payment", verifyToken, async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Validate required fields
    if (!paymentData.ptin || !paymentData.taxType || !paymentData.amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Generate CTD Transaction ID (14-digit starting with 36 as per Table 3)
    const ctdTransactionId = "36" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
    
    console.log("Generated CTD Transaction ID:", ctdTransactionId);
    console.log("Payment data received:", JSON.stringify(paymentData, null, 2));
    
    // Create new payment document
    const newPayment = new Payment({
      ptin: paymentData.ptin,
      name: paymentData.name,
      taxType: paymentData.taxType,
      purpose: paymentData.purpose,
      taxPeriodFrom: paymentData.taxPeriodFrom,
      taxPeriodTo: paymentData.taxPeriodTo,
      amount: paymentData.amount,
      remarks: paymentData.remarks,
      date: paymentData.date,
      ctdTransactionId: ctdTransactionId, // Store CTD Transaction ID
      submittedAt: new Date()
    });
    
    // Save to MongoDB
    const savedPayment = await newPayment.save();
    
    console.log("Payment saved successfully with ID:", savedPayment._id);
    console.log("CTD Transaction ID being returned:", ctdTransactionId);
    
    // Payment saved successfully
    
    res.json({
      message: "Payment submitted successfully",
      paymentId: savedPayment._id,
      ctdTransactionId: ctdTransactionId, // Return CTD Transaction ID
      submittedAt: savedPayment.submittedAt
    });
    
  } catch (error) {
    console.error("Error in submit-payment:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: "Failed to save payment to database",
      error: error.message 
    });
  }
});

// Validate bank account credentials
app.post("/api/validate-bank-account", verifyToken, async (req, res) => {
  try {
    const { bankName, username, password, paymentData, challanNo, ddocode, hoa } = req.body;
    
    // Find bank account in bankAccounts array
    const bankAccount = bankAccounts.find(
      account => account.bank === bankName && 
      account.userId === username && 
      account.password === password
    );
    
    if (!bankAccount) {
      return res.status(401).json({ 
        valid: false,
        message: "Invalid banking credentials. Please check your account holder name and password." 
      });
    }
    
    // Generate bank reference number (10-digit as per Table 5)
    const bankRef = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // Bank authentication successful
    
    res.json({
      valid: true,
      message: "Bank authentication successful",
      bankDetails: {
        bankName: bankName,
        accountNumber: bankAccount.accountNo,
        accountHolder: bankAccount.userId
      },
      bankRef: bankRef,
      transactionDetails: {
        challanNo: challanNo,
        ddocode: ddocode,
        hoa: hoa,
        amount: paymentData?.amount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      valid: false,
      message: "Bank authentication failed. Please try again." 
    });
  }
});

// Store successful transaction
app.post("/api/store-transaction-success", verifyToken, async (req, res) => {
  try {
    const transactionData = req.body;
    
    // Validate required fields
    if (!transactionData.ptin || !transactionData.amount || !transactionData.bankName) {
      return res.status(400).json({ message: "Missing required transaction fields" });
    }
    
    // Check if transaction already exists to reuse CRN
    const existingTransaction = await TransactionSuccess.findOne({
      ptin: transactionData.ptin,
      challanNo: transactionData.challanNo,
      bankRef: transactionData.bankRef
    });
    
    let crn;
    if (existingTransaction) {
      // Reuse existing CRN if transaction already exists
      crn = existingTransaction.crn;
    } else {
      // Generate new CRN only for new transactions (12-digit)
      crn = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    }
    
    let savedTransaction;
    
    if (existingTransaction) {
      // Update existing transaction
      existingTransaction.completedAt = new Date();
      savedTransaction = await existingTransaction.save();
    } else {
      // Create new transaction success document
      const newTransaction = new TransactionSuccess({
        ptin: transactionData.ptin,
        name: transactionData.name,
        taxType: transactionData.taxType,
        purpose: transactionData.purpose,
        taxPeriodFrom: transactionData.taxPeriodFrom,
        taxPeriodTo: transactionData.taxPeriodTo,
        amount: transactionData.amount,
        remarks: transactionData.remarks,
        date: transactionData.date,
        
        // Bank transaction details
        bankName: transactionData.bankName,
        accountNumber: transactionData.accountNumber,
        accountHolder: transactionData.accountHolder,
        
        // Transaction references
        challanNo: transactionData.challanNo,
        ddocode: transactionData.ddocode,
        hoa: transactionData.hoa,
        bankRef: transactionData.bankRef,
        crn: crn,
        etaxPaymentReference: transactionData.etaxPaymentReference,
        paymentId: transactionData.paymentId,
        
        // Document display values
        merchantName: "Telangana",
        typeOfTax: "Telangana Commercial Tax",
        
        // Status and timestamps
        transactionStatus: "Completed",
        bankTimestamp: new Date(transactionData.bankTimestamp),
        completedAt: new Date()
      });
      
      // Save to MongoDB
      savedTransaction = await newTransaction.save();
    }
    
    // Transaction success saved
    
    res.json({
      message: "Transaction success stored successfully",
      transactionId: savedTransaction._id,
      crn: savedTransaction.crn,
      completedAt: savedTransaction.completedAt
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to save transaction success to database",
      error: error.message 
    });
  }
});

// Get transaction history for a user
app.get("/api/transaction-history", verifyToken, async (req, res) => {
  try {
    const transactions = await TransactionSuccess.find({ ptin: req.user.ptin })
      .sort({ completedAt: -1 })
      .limit(50); // Get last 50 transactions
    
    res.json({
      message: "Transaction history retrieved successfully",
      transactions: transactions,
      count: transactions.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch transaction history",
      error: error.message 
    });
  }
});

// Get specific transaction by ID
app.get("/api/transaction/:transactionId", verifyToken, async (req, res) => {
  try {
    const transaction = await TransactionSuccess.findById(req.params.transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json({
      message: "Transaction retrieved successfully",
      transaction: transaction
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch transaction",
      error: error.message 
    });
  }
});

/* ---------------------- Server start ---------------------- */
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
