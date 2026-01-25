\
(function(){
  const input = document.getElementById("avatarInput");
  const img = document.getElementById("avatarPreview");
  const hint = document.querySelector(".previewHint");

  if (!input || !img) return;

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) {
      img.style.display = "none";
      if (hint) hint.style.display = "inline";
      return;
    }
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);
    img.style.display = "block";
    if (hint) hint.style.display = "none";
  });
})();
