const multer=require('multer');
const path=require('path');
const crypto=require('crypto');

const storage = multer.diskStorage({
    // This defines the destination directory for storing files
    destination: function (req, file, cb) {
        // The cb function is a callback that takes two parameters: an error and a path
        // The null argument means there is no error
        // The "public/assets" argument means the files will be stored in this directory
        cb(null, "public/images/uploads");
    },
    // This defines the file name for storing files
    filename: function (req, file, cb) {
        crypto.randomBytes(12,function(err,name){
       const fn= name.toString("hex")+path.extname(file.originalname);
       cb(null,fn)
        })
        // The cb function is a callback that takes two parameters: an error and a name
        // The null argument means there is no error
        // The file.originalname argument means the files will be stored with their original names
    },
});

// This creates a multer instance with the storage engine
const upload = multer({ storage });
module.exports=upload;