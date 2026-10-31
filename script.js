const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const imageViewer = document.querySelector(".image-viewer");
const imageViewerContent = document.querySelector(".image-viewer-content");
const imageViewerCaption = document.querySelector(".image-viewer-caption");
const imageViewerClose = document.querySelector(".image-viewer-close");
const imageZoomOut = document.querySelector(".image-viewer-zoom-out");
const imageZoomReset = document.querySelector(".image-viewer-zoom-reset");
const imageZoomIn = document.querySelector(".image-viewer-zoom-in");
const zoomableImages = document.querySelectorAll(
  ".hero, .about.section, .brands.section, .quality-card, .partner, .contact.section",
);
const minimumImageScale = 1;
const maximumImageScale = 3;
const imageScaleStep = 0.25;
let imageScale = minimumImageScale;

function setImageScale(scale) {
  imageScale = Math.min(maximumImageScale, Math.max(minimumImageScale, scale));
  imageViewerContent.style.transform = `scale(${imageScale})`;
  imageZoomReset.textContent = `${Math.round(imageScale * 100)}%`;
  imageZoomOut.disabled = imageScale === minimumImageScale;
  imageZoomIn.disabled = imageScale === maximumImageScale;
}

function getBackgroundImage(element) {
  const backgroundImages = [
    ...getComputedStyle(element).backgroundImage.matchAll(
      /url\((?:"([^"]+)"|'([^']+)'|([^)]*))\)/g,
    ),
  ];
  const lastBackgroundImage = backgroundImages.at(-1);
  return (
    lastBackgroundImage?.[1] ||
    lastBackgroundImage?.[2] ||
    lastBackgroundImage?.[3].trim()
  );
}

function openImageViewer(element) {
  const imageSource = getBackgroundImage(element);

  if (!imageSource) {
    return;
  }

  const heading = element.querySelector("h1, h2, h3");
  imageViewerContent.src = imageSource;
  imageViewerContent.alt = heading?.textContent.trim() || "Enlarged website image";
  imageViewerCaption.textContent = imageViewerContent.alt;
  setImageScale(minimumImageScale);
  imageViewer.showModal();
}

function closeImageViewer() {
  imageViewer.close();
  imageViewerContent.removeAttribute("src");
  setImageScale(minimumImageScale);
}

imageZoomOut.addEventListener("click", () =>
  setImageScale(imageScale - imageScaleStep),
);
imageZoomReset.addEventListener("click", () =>
  setImageScale(minimumImageScale),
);
imageZoomIn.addEventListener("click", () =>
  setImageScale(imageScale + imageScaleStep),
);
imageViewer.addEventListener("wheel", (event) => {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }

  event.preventDefault();
  setImageScale(imageScale + (event.deltaY < 0 ? imageScaleStep : -imageScaleStep));
});

zoomableImages.forEach((element) => {
  element.classList.add("image-zoom-target");

  const zoomButton = document.createElement("button");
  zoomButton.className = "image-zoom-button";
  zoomButton.type = "button";
  zoomButton.setAttribute("aria-label", "Enlarge image");
  zoomButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3a7.5 7.5 0 1 0 4.7 13.35L21 22l1-1-5.65-5.8A7.5 7.5 0 0 0 10.5 3Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM10 6v3H7v1.5h3v3h1.5v-3h3V9.0h-3V6H10Z"/></svg>';
  zoomButton.addEventListener("click", () => openImageViewer(element));
  element.append(zoomButton);

  element.addEventListener("click", (event) => {
    if (event.target.closest("a, button, input, textarea, select")) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    const clickedBackground =
      event.target === element ||
      event.target.classList.contains("partner-shade") ||
      (element.matches(".quality-card") && event.clientY <= bounds.top + 121);

    if (!clickedBackground) {
      return;
    }

    openImageViewer(element);
  });
});

imageViewerClose.addEventListener("click", closeImageViewer);
imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) {
    closeImageViewer();
  }
});
imageViewer.addEventListener("cancel", () => {
  imageViewerContent.removeAttribute("src");
  setImageScale(minimumImageScale);
});
imageViewer.addEventListener("close", () => {
  imageViewerContent.removeAttribute("src");
  setImageScale(minimumImageScale);
});

const revealElements = document.querySelectorAll(
  ".hero, .values-strip article, .about.section, .about-content, .brands.section, .brand-copy, .quality .section-heading, .quality-card, .partner, .partner-content, .contact.section, .contact-info, .contact-form, .logo img, .footer-logo, .footer-logo img, .footer nav, .footer > p",
);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (prefersReducedMotion) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-enabled");
  revealElements.forEach((element) => element.classList.add("scroll-reveal"));

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

if (!prefersReducedMotion) {
  const textWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;

        if (
          !parent ||
          !node.textContent.trim() ||
          parent.closest(
            "script, style, svg, [aria-hidden='true'], .image-viewer",
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );
  const textNodes = [];

  while (textWalker.nextNode()) {
    textNodes.push(textWalker.currentNode);
  }

  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;

  textNodes.forEach((textNode) => {
    const text = textNode.textContent;
    const fragment = document.createDocumentFragment();
    const letterRun = document.createElement("span");
    letterRun.className = "letter-run";
    const characters = segmenter
      ? Array.from(segmenter.segment(text), (part) => part.segment)
      : Array.from(text);
    let word = document.createElement("span");
    word.className = "letter-word";
    let letterIndex = 0;

    characters.forEach((character) => {
      if (/^\s+$/.test(character)) {
        if (word.childNodes.length) {
          letterRun.append(word);
          word = document.createElement("span");
          word.className = "letter-word";
        }
        letterRun.append(document.createTextNode(character));
        letterIndex = 0;
        return;
      }

      const letter = document.createElement("span");
      letter.className = "letter-animated";
      letter.style.setProperty(
        "--letter-delay",
        `${Math.min(letterIndex * 18, 360)}ms`,
      );
      letter.textContent = character;
      word.append(letter);
      letterIndex += 1;
    });

    if (word.childNodes.length) {
      letterRun.append(word);
    }

    fragment.append(letterRun);
    textNode.replaceWith(fragment);
  });
}

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.textContent = "☰";
  });
});



document.getElementById("contactForm").addEventListener("submit", async (event) => {

    const form = event.currentTarget;
    const formNote = document.getElementById("formNote");

    // Check form validation
    if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        formNote.textContent = "";
        return;
    }

    event.preventDefault();

    const formData = new FormData(form);

    const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        subject: formData.get("subject"),
        message: formData.get("message")
    };

    formNote.textContent = "Sending message...";

    try {
        const response = await fetch("http://127.0.0.1:5000/send-message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Message sending failed");
        }

        formNote.textContent = "Message sent successfully!";
        form.reset();

    } catch (error) {
        console.error("Email error:", error);
        formNote.textContent = "Unable to send message. Please try again.";
    }
});
