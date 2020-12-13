var fs = require("fs");
const path = require("path");
module.exports = {
  carouselImages: () => {
    return new Promise((resolve, reject) => {
      fs.readdir("public/carousel-images", (error, files) => {
        if (error) {
          resolve(false);
        } else {
          resolve(files);
        }
      });
    });
  },
  productcarouselImages: (id) => {
    return new Promise((resolve, reject) => {
      fs.readdir(
        "public/product-carousel-images/thumbnails",
        (error, files) => {
          if (error) {
            resolve(false);
          } else {
            var carouselFile = [];
            files.forEach((file) => {
              if (path.extname(file) == "." + id) carouselFile.push(file);
            });
            resolve(carouselFile);
          }
        }
      );
    });
  },
  removeCarousel: (img) => {
    try {
      fs.unlinkSync("public/carousel-images/" + img);
    } catch (err) {
      console.log(err);
    }
  },
  removeProductCarousel: (img) => {
    try {
      fs.unlinkSync("public/product-carousel-images/thumbnails/" + img);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  },
};
