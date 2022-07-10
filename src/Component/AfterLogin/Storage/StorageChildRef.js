import {  ref } from "firebase/storage";
import { storage } from "../../../Firebase/FirebaseConfig";



// Create a child reference
const imagesRef = ref(storage, 'images');
// imagesRef now points to 'images'

// Child references can also take paths delimited by '/'
const spaceRef = ref(storage, 'images/space.jpg');
// spaceRef now points to "images/space.jpg"
// imagesRef still points to "images"




// const spaceRef = ref(storage, 'images/space.jpg');

// // Parent allows us to move to the parent of a reference
// const imagesRef = spaceRef.parent;
// // imagesRef now points to 'images'

// // Root allows us to move all the way back to the top of our bucket
// const rootRef = spaceRef.root;
// // rootRef now points to the root










// const spaceRef = ref(storage, 'images/space.jpg');

// // Reference's path is: 'images/space.jpg'
// // This is analogous to a file path on disk
// spaceRef.fullPath;

// // Reference's name is the last segment of the full path: 'space.jpg'
// // This is analogous to the file name
// spaceRef.name;

// // Reference's bucket is the name of the storage bucket where files are stored
// spaceRef.bucket;