import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  createUserWithEmailAndPassword,
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
const signUpContinue = document.getElementById("submitBtn");
const fullName = document.getElementById("full-name");
const profileImg = document.getElementById("prfile-img");
const email = document.getElementById("email");
const gender = document.getElementById("gender");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const nevigateSignIn = document.getElementById("signInNavigation");

let user_name = "";
let user_email = "";
let user_profile;
let user_password = "";
let user_confirm_password = "";
let user_gender = "male";
let handleAuthStateChange = 0;

signUpContinue.setAttribute("disabled", "true");
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

nevigateSignIn.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "/auth/signIn/index.html";
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
        profile_img: user,
      }).then(() => {
        window.location.href = "/dashBoard/index.html";
        hideLoader();
      });
    })
    .catch((error) => {
      console.log(error, "->erro");
    });
});

profileImg.addEventListener("input", () => {
  const filename = profileImg.files[0];
  user_profile = filename.name;
});

signUpContinue.addEventListener("click", (event) => {
  event.preventDefault();
  showLoader();
  createUserWithEmailAndPassword(auth, user_email, user_password)
    .then(async (data) => {
      let uploadProfile;
      if (user_profile) {
        const imgRef = ref(
          mediaStorege,
          `upload/profileImages/${Date.now()}-${user_profile}`
        );
        const metadata = {
          contentType: `image/${user_profile.split(".").pop()}`,
        };
        uploadProfile = await uploadBytes(imgRef, user_profile, metadata);
      }
      setDoc(doc(collection(cloudStorage, "auth_users"), data.user.uid), {
        user_name,
        user_email,
        user_gender,
        profile_img: uploadProfile ? uploadProfile.ref?.fullPath : "undefined",
      }).then(() => {
        window.location.href = "/dashBoard/index.html";
        hideLoader();
      });
    })
    .catch((error) => {
      hideLoader();
      console.log(error, "error firebase");
      if (error.code === "auth/email-already-in-use") {
        const emailError = document.getElementById("emailError");
        emailError.innerHTML = `Email is already in use`;
        emailError.classList.add("displayError");
        document.getElementById("email").classList.add("inputError");
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
  signUpContinue.setAttribute("disabled", "true");
  signUpContinue.classList.add("disableBtn");
  if (user_confirm_password && user_email && user_name && user_password) {
    if (!(user_name.length >= 3)) {
    } else if (!/\S+@\S+/.test(user_email)) {
    } else if (!(user_password.length >= 6)) {
    } else if (!(user_password == confirmPassword.value)) {
      const error = document.getElementById("confirmPasswordError");
      error.innerHTML = `Password does't match`;
      error.classList.add("displayError");
      document.getElementById("confirm-password").classList.add("inputError");
    } else {
      const error = document.getElementById("confirmPasswordError");
      error.classList.remove("displayError");
      document
        .getElementById("confirm-password")
        .classList.remove("inputError");
      signUpContinue.classList.remove("disableBtn");
      signUpContinue.removeAttribute("disabled");
    }
  }
};

const validateFullName = (value) => {
  user_name = value;
  handleBtnDissable();
  return value.length >= 3;
};
const validateEmail = (value) => {
  user_email = value;
  handleBtnDissable();
  return /\S+@\S+/.test(value);
};
const validateGender = (value) => {
  user_gender = value;
  handleBtnDissable();
  return value != undefined || value != null;
};
const validatePassword = (value) => {
  user_password = value;
  handleBtnDissable();
  return value.length >= 6;
};
const validateConfirmPassword = (value) => {
  user_confirm_password = value;
  handleBtnDissable();
  return value == user_password;
};

fullName.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Min. 3 letter required",
    "nameError",
    fullName,
    validateFullName
  )
);
email.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Must include @",
    "emailError",
    email,
    validateEmail
  )
);
gender.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Select gender",
    "genderError",
    gender,
    validateGender
  )
);
password.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Min. 6 letters",
    "passwordError",
    password,
    validatePassword
  )
);
confirmPassword.addEventListener("input", () =>
  handleInputlistener(
    event,
    "Password does't match",
    "confirmPasswordError",
    confirmPassword,
    validateConfirmPassword
  )
);
