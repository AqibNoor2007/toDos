import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  limit,
  startAfter,
  doc,
  orderBy,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const auth = getAuth();
const cloudStorage = getFirestore();
const storege = getStorage();

const signOutBtn = document.getElementById("logOutBtn");
const welcomeMsg = document.getElementById("welcoimeText");
const addTodoInput = document.getElementById("addTodo");
const submitTodo = document.getElementById("submitTodo");
const filterSelect = document.getElementById("select");
const profileImg = document.getElementById("profileImage");
const paginationContainer = document.getElementById("pagination-container");

const limitPerPage = 5;
let toDoValue;
let currentUser;
let logInUser;
let hitQurey;
let idTodo = 1;
let todosData = [];
let paginationQurey;

showLoader();
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    showUserDetail(currentUser);
    fetchTodosData();
  } else {
    window.location.href = "/auth/signIn/index.html";
  }
});

signOutBtn.addEventListener("click", () => {
  showLoader();
  signOut(auth)
    .then(() => {
      hideLoader();
    })
    .catch((error) => {
      hideLoader();
      console.log(error, "-> data");
    });
});

const showUserDetail = async (currentUser) => {
  try {
    logInUser = await getDoc(
      doc(cloudStorage, "auth_users", currentUser.uid)
    ).then((data) => data.data());
    welcomeMsg.innerText = `Welcome ${logInUser.user_name}`;
    if (logInUser.profile_img == "undefined") {
      if (logInUser.user_gender == "male") {
        profileImg.setAttribute("src", "../assets/menAvatar.png");
      } else if (logInUser.user_gender == "female") {
        profileImg.setAttribute("src", "../assets/femaleAvatar.png");
      } else {
        profileImg.setAttribute("src", "../assets/otherAvatar.png");
      }
    }
    // else {
    //   getDownloadURL(ref(storege, logInUser.profile_img)).then((url) =>
    //     console.log(url, "->url")
    //   );
    // }
  } catch {
    hideLoader();
  }
};

const handleBtnDissable = () => {
  if (toDoValue.length > 0) {
    submitTodo.classList.remove("disableBtn");
    submitTodo.removeAttribute("disabled");
  } else {
    submitTodo.setAttribute("disabled", "true");
    submitTodo.classList.add("disableBtn");
  }
};

addTodoInput.addEventListener("input", (event) => {
  toDoValue = event.target.value;
  handleBtnDissable();
});

submitTodo.addEventListener("click", (event) => {
  event.preventDefault();
  showLoader();
  setDoc(doc(collection(cloudStorage, "toDos")), {
    id: idTodo,
    toDoValue: toDoValue,
    status: "pending",
    user_id: currentUser.uid,
    posted_email: logInUser.user_email,
    posted_name: logInUser.user_name,
    created_date: new Date(),
  })
    .then(() => {
      showNotification("Success", "Todo Posted", "success");
      fetchTodosData();
      addTodoInput.value = "";
      toDoValue = addTodoInput.value;
      ++idTodo;
      handleBtnDissable();
    })
    .catch((error) => {
      console.log(error, "todo error");
      showNotification("Error", "Some thing went wrong", "error");
      hideLoader();
    });
});

filterSelect.addEventListener("change", (event) => {
  const selectedValue = event.target.value;
  if (selectedValue == 1) {
    showLoader();
    fetchTodosData();
  } else if (selectedValue == 2) {
    showLoader();
    fetchTodosData("completed");
  } else if (selectedValue == 3) {
    showLoader();
    fetchTodosData("pending");
  }
});

const listTodo = async (arrayTodos) => {
  const existingULs = document.querySelectorAll(".removeElement");
  const existHr = document.querySelectorAll(".removeHr");
  existingULs.forEach((ul) => ul.remove());
  existHr.forEach((hr) => hr.remove());

  arrayTodos.forEach(async (docData) => {
    const data = await docData.data();
    const createList = document.createElement("ul");
    const createMsgDiv = document.createElement("div");
    const createEditDeleteDiv = document.createElement("div");
    const createTimeDiv = document.createElement("div");
    const createStatusDiv = document.createElement("div");
    const createEditDeletBtnLi = document.createElement("Li");
    const createCheckboxLi = document.createElement("li");
    const createMsgLi = document.createElement("li");
    const checkbox = document.createElement("input");
    const toDoMsg = document.createElement("p");
    const dateElement = document.createElement("p");
    const statusElement = document.createElement("span");
    const editIcon = createIcon("fa-pencil", "text-info", "px-3");
    const deleteIcon = createIcon("fa-trash-o", "text-danger");
    const hrTag = document.createElement("hr");

    hrTag.classList.add("removeHr");
    toDoMsg.classList.add("lead", "fw-normal", "mb-0");
    createMsgDiv.classList.add("d-flex", "customWidth");
    createTimeDiv.classList.add("text-end", "text-muted");
    createStatusDiv.classList.add("text-end", "text-muted");
    dateElement.classList.add("small", "mb-0");
    createList.classList.add(
      "list-group",
      "justify-content-between",
      "list-group-horizontal",
      "rounded-0",
      "bg-transparent",
      "listItem",
      "removeElement"
    );
    createCheckboxLi.classList.add(
      "list-group-item",
      "pi-0",
      "d-flex",
      "align-items-center",
      "py-1",
      "maginRight",
      "rounded-0",
      "border-0",
      "bg-transparent"
    );
    createMsgLi.classList.add(
      "list-group-item",
      "pi-0",
      "py-1",
      "d-flex",
      "align-items-center",
      "flex-grow-1",
      "border-0",
      "bg-transparent"
    );
    createEditDeletBtnLi.classList.add(
      "list-group-item",
      "pe-0",
      "py-1",
      "rounded-0",
      "border-0",
      "bg-transparent",
      "editDeleteBtn"
    );
    createEditDeleteDiv.classList.add(
      "d-flex",
      "flex-row",
      "justify-content-end",
      "mb-2"
    );
    if (data.status == "completed") {
      statusElement.classList.add(
        "badge",
        "text-bg-success",
        "fs-6",
        "customSpacing",
        "captilize"
      );
    } else {
      statusElement.classList.add(
        "badge",
        "text-bg-warning",
        "fs-6",
        "customSpacing",
        "captilize"
      );
    }

    checkbox.checked = data.status === "completed";
    toDoMsg.textContent = data.toDoValue;
    checkbox.type = "checkbox";
    dateElement.innerHTML = `${new Date(
      data.created_date.seconds * 1000 + data.created_date.nanoseconds / 1e6
    ).toLocaleDateString()}`;
    statusElement.innerHTML = `${data.status}`;

    function createIcon(iconClass, colorClass, extraClass) {
      const icon = document.createElement("i");
      icon.classList.add("fa", iconClass, "icon", colorClass, extraClass);
      icon.setAttribute("aria-hidden", "true");
      return icon;
    }

    deleteIcon.addEventListener("click", async () => {
      showLoader();
      await deleteDoc(doc(cloudStorage, "toDos", docData.id));
      fetchTodosData();
      showNotification("Success", "Todo Deleted", "success");
    });

    checkbox.addEventListener("input", async (event) => {
      const updateRef = doc(cloudStorage, "toDos", docData.id);
      if (event.target.checked) {
        showLoader();
        await updateDoc(updateRef, {
          status: "completed",
        });
        fetchTodosData();
        showNotification("Success", "Todo Completed", "success");
      } else {
        showLoader();
        await updateDoc(updateRef, {
          status: "pending",
        });
        fetchTodosData();
        showNotification("Success", "Todo Incompleted", "success");
      }
    });

    editIcon.addEventListener("click", () => {
      const editForm = createEditForm(data);
      const listItem = createList.closest(".listItem");
      listItem.innerHTML = "";
      listItem.appendChild(editForm);
    });

    const createEditForm = (todoData) => {
      const editForm = document.createElement("form");
      const editInput = document.createElement("input");
      const saveButton = document.createElement("button");
      editInput.classList.add("form-control", "formInput");
      editForm.classList.add("d-flex", "w-100");
      saveButton.classList.add("btn", "btn-primary", "formBtn");
      editInput.type = "text";
      editInput.value = todoData.toDoValue;
      saveButton.type = "submit";
      saveButton.textContent = "Save";

      editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        showLoader();
        const updatedText = editInput.value;
        const updateRef = doc(cloudStorage, "toDos", docData.id);
        await updateDoc(updateRef, {
          toDoValue: updatedText,
        });
        fetchTodosData();
        showNotification("Success", "Todo Updated", "success");
      });
      editForm.appendChild(editInput);
      editForm.appendChild(saveButton);
      return editForm;
    };

    createCheckboxLi.appendChild(checkbox);
    createMsgLi.appendChild(toDoMsg);
    createMsgDiv.appendChild(createCheckboxLi);
    createMsgDiv.appendChild(createMsgLi);
    if (data.status != "completed") {
      createEditDeleteDiv.appendChild(editIcon);
      createEditDeleteDiv.appendChild(deleteIcon);
    }
    createStatusDiv.appendChild(statusElement);
    createTimeDiv.appendChild(dateElement);
    createEditDeletBtnLi.appendChild(createEditDeleteDiv);
    createEditDeletBtnLi.appendChild(createTimeDiv);
    createEditDeletBtnLi.appendChild(createStatusDiv);

    createList.appendChild(createMsgDiv);
    createList.appendChild(createEditDeletBtnLi);
    // Append the todo item UI to the container
    todoListContainer.appendChild(createList);
    todoListContainer.appendChild(hrTag);
  });
  hideLoader();
};

const paginationUi = async (totalTodos) => {
  const existLis = document.querySelectorAll(".page-item");
  existLis.forEach((li) => li.remove());
  idTodo = totalTodos + 1;
  const totalPages = Math.ceil(totalTodos / limitPerPage);
  console.log(filterSelect, "filter");
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.classList.add("page-item");
    li.addEventListener("click", async () => {
      let skip = totalTodos - (i - 1) * limitPerPage;
      showLoader();
      paginationQurey = query(
        collection(cloudStorage, "toDos"),
        where("user_id", "==", currentUser.uid),
        orderBy("id", "desc"),
        startAfter(skip + 1),
        limit(limitPerPage)
      );
      const querySnapshot = await getDocs(paginationQurey);
      todosData = querySnapshot;
      listTodo(todosData);
    });
    li.innerText = i;
    paginationContainer.appendChild(li);
  }
};

const fetchTodosData = async (filterValue) => {
  const allTodosQurey = query(
    collection(cloudStorage, "toDos"),
    where("user_id", "==", currentUser.uid)
  );
  const allTodos = await getDocs(allTodosQurey);

  if (!filterValue) {
    hitQurey = query(
      collection(cloudStorage, "toDos"),
      where("user_id", "==", currentUser.uid),
      orderBy("id", "desc"),
      limit(limitPerPage)
    );
  } else {
    hitQurey = query(
      collection(cloudStorage, "toDos"),
      where("user_id", "==", currentUser.uid),
      where("status", "==", filterValue),
      orderBy("id", "desc"),
      limit(limitPerPage)
    );
  }

  const querySnapshot = await getDocs(hitQurey);
  todosData = querySnapshot;
  listTodo(todosData);
  paginationUi(allTodos.docs.length);
};
