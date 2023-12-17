import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import {
  getFirestore,
  collection,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();
const auth = getAuth();
const cloudStorage = getFirestore();
const mediaStorege = getStorage();

const googleContinue = document.getElementById("googleLogIn");
const nevigateSignUp = document.getElementById("signUpNavigation");
const email = document.getElementById("email");
const password = document.getElementById("password");
const signInContinue = document.getElementById("signIn");

let user_email = "";
let user_password = "";
let handleAuthStateChange = 0;

signInContinue.setAttribute("disabled", "true");
nevigateSignUp.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "/auth/signUp/index.html";
});

showLoader();
onAuthStateChanged(auth, (user) => {
  if (user) {
    hideLoader();
    if (handleAuthStateChange == 0) {
      window.location.href = "/dashBoard/index.html";
    }
  } else {
    setTimeout(() => {
      hideLoader();
    }, 200);
  }
  ++handleAuthStateChange;
});

googleContinue.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(async (result) => {
      const user = result.user;
      const profileImg = user.photoURL.split("/");
      const imgRef = await ref(
        mediaStorege,
        `upload/profile_images/${profileImg[profileImg.length - 1]}`
      );
      const uploadProfile = await uploadBytes(imgRef);
      setDoc(doc(collection(cloudStorage, "auth_users"), user.uid), {
        user_name: user.displayName,
        user_email: user.email,
        profile_img: uploadProfile.ref.fullPath,
      }).then(() => {
        window.location.href = "/dashBoard/index.html";
      });
    })
    .catch((error) => {
      hideLoader();
      console.log(error, "->erro");
    });
});

signInContinue.addEventListener("click", (event) => {
  event.preventDefault();
  showLoader();
  signInWithEmailAndPassword(auth, user_email, user_password)
    .then(() => {
      hideLoader();
      window.location.href = "/dashBoard/index.html";
    })
    .catch((error) => {
      hideLoader();
      console.log(error, "Log in error");
      if (error.code === "auth/invalid-credential") {
        showNotification("Error", "Invalid Credentials ", "error");
      }
    });
});

const handleInputlistener = (
  event,
  errorMsg,
  errorId,
  inputElement,
  validating
) => {
  let value = event.target.value;
  if (validating(value)) {
    document.getElementById(errorId).classList.remove("displayError");
    inputElement.classList.remove("inputError");
  } else {
    inputElement.classList.add("inputError");
    document.getElementById(errorId).innerHTML = errorMsg;
    document.getElementById(errorId).classList.add("displayError");
  }
};

const handleBtnDissable = () => {
  signInContinue.setAttribute("disabled", "true");
  signInContinue.classList.add("disableBtn");
  if (user_email && user_password) {
    if (!/\S+@\S+/.test(user_email)) {
    } else if (!(user_password.length >= 6)) {
    } else {
      signInContinue.classList.remove("disableBtn");
      signInContinue.removeAttribute("disabled");
    }
  }
};

const validateEmail = (value) => {
  user_email = value;
  handleBtnDissable();
  return /\S+@\S+/.test(value);
};
const validatePassword = (value) => {
  user_password = value;
  handleBtnDissable();
  return value.length >= 6;
};

email.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Must include @",
    "emailError",
    email,
    validateEmail
  )
);

password.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Min. 6 letter required",
    "passwordError",
    password,
    validatePassword
  )
);
