exports.root = (req, res) => {
  res.status(200).send("root");
};

exports.index = (req, res) => {
  res.render("header", {
    pageData: {
      viewName: "map",
      pageTitle: "使用者查詢",
      hasJS: true,
      hasCSS: true,
      CssRoute: "map/search"
    }
  });
};
