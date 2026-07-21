import { getObfId } from "./obf-helpers";

const initHome = () => {
  const tagline = document.getElementById(getObfId("tagline"));

  if (tagline) {
    const messages = ["every dollar finds its way.", "deposit your URL. collect your content.", "interest rates this fast.", "silent as a vault.", "fully audited. fully yours.", "the green light for anything.", "ARM up. log in.", "no taxes on cargo.", "balance: untraceable."];
    const pick = messages[Math.floor(Math.random() * messages.length)];
    tagline.textContent = pick;
    tagline.classList.remove("opacity-0");
  }
};

document.addEventListener("astro:page-load", initHome);
document.addEventListener("DOMContentLoaded", initHome);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initHome();
}
