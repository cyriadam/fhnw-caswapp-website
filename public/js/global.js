// console.log("Client side javascript is loaded");

// -- elements --
let $modalPopup;
let popupDiseabled = false;
let windowOnkeydownBackup;
const modalTemplate =
  "<div id='popup'><div id='popup-container'><span id='popup-close'>&times;</span><div id='popup-content'>${modalContent}</div></div></div>";

// usage : document.getElementById("button1").onclick = () => popup("<h2>Popup</h2><p>hello World1</p>");
const popup = (modalContent) => {
  if (popupDiseabled) return;
  if ($modalPopup === undefined) {
    let popup = eval("`" + modalTemplate + "`");
    document.body.insertAdjacentHTML("afterbegin", popup);
    $modalPopup = document.getElementById("popup");
    document.getElementById("popup-close").onclick = () => {
      window.onkeydown = windowOnkeydownBackup;
      $modalPopup.style.display = "none";
    };
  } else {
    document.getElementById("popup-content").innerHTML = modalContent;
  }
  $modalPopup.style.display = "block";
  document.activeElement.blur(); // remove the focus on the active element
  windowOnkeydownBackup = window.onkeydown; // diseable tab
  window.onkeydown = (e) => {
    if (e.key === "Tab") e.preventDefault();
  };
};
