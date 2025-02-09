document.addEventListener("DOMContentLoaded", () => {
    const scrollToTop = document.getElementById("scrollToTop");
    const topImage = document.getElementById("topImage");
  
    // Array of image paths
    const images = [
      "img/top1.png",
      "img/top2.png",
      "img/top3.png",
      "img/top4.png",
      "img/top5.png",
      "img/top6.png",
    ];
  
    // Randomly select an image on page load
    const setRandomImage = () => {
      const randomIndex = Math.floor(Math.random() * images.length);
      topImage.src = images[randomIndex];
    };
  
    // Show/hide the button on scroll
    window.addEventListener("scroll", () => {
      if (window.scrollY > 200) { // Adjust the scroll distance as needed
        scrollToTop.style.display = "block";
      } else {
        scrollToTop.style.display = "none";
      }
    });
  
    // Scroll to top on click
    scrollToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setRandomImage(); // Set a new random image after returning to top
    });
  
    // Initialize with a random image
    setRandomImage();
  });
  