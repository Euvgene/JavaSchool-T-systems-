let currentPage = null;


deleteProduct = function (id) {
    $.ajax({
        type: "GET",
        url: 'http://localhost:8189/api/v1/products/delete',
        data: {
            product_id: id,
        },
        success: function (result) {
            $("#buttonDelete" + id).hide(100);
        }
    })
}

function generatePagesIndexes(startPage, endPage) {
    let arr = [];
    for (let i = startPage; i < endPage + 1; i++) {
        arr.push(i);
    }
    return arr;
}

function getProductCount(formData) {
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: 'http://localhost:8189/api/v1/products/get-page-count',
        data: JSON.stringify(formData),
        dataType: 'json',
        success: function (response) {
            productCount = response;
            if (productCount < 8) {


                let totalPages = productCount / 8
                let minPageIndex = (currentPage >= totalPages) ? currentPage - 2 : currentPage - 1;
                if (minPageIndex < 1) {
                    minPageIndex = 1;
                }

                let maxPageIndex = (currentPage === 1) ? currentPage + 2 : currentPage + 1;
                if (maxPageIndex > totalPages) {
                    maxPageIndex = totalPages;
                }
                let PaginationArray = generatePagesIndexes(minPageIndex, maxPageIndex)
                $("#pagination").empty()
                $("#pagination").append("<li class=\"page-item\" >\n" +
                    "                    <button class=\"page-link\" tabindex=\"-1\" id='prePage' onclick=' getProducts(currentPage - 1)' >Previous</button>\n" +
                    "                </li>")
                for (let k = 0; k < PaginationArray.length; k++) {
                    let classOfLi = (currentPage === PaginationArray[k]) ? "page-item active" : "page-item"
                    $("#pagination").append("<li class=\"" + classOfLi + "\"><a class=\"page-link\" onclick=\"getProducts(" + PaginationArray[k] + ")\" id=''>" + PaginationArray[k] + "</a></li>")
                }
                $("#pagination").append("  <li class=\"page-item\">" +
                    "                    <button class=\"page-link\" id='nextPage' onclick=' getProducts(currentPage + 1)'>Next</button  >" +
                    "                </li>")
                if (currentPage === 1) {
                    $("#prePage").prop('disabled', true)
                } else $("#prePage").prop('disabled', false)
                if (currentPage >= totalPages) {
                    $("#nextPage").prop('disabled', true)
                } else $("#nextPage").prop('disabled', false)
            } else {
                $("#pagination").empty()
            }
        }
    })
}


function getProducts(pageIndex = 1) {
    products = new Map();
    let formData = {
        page: pageIndex,
        minPrice: $("#filterMinCost").val() ? $("#filterMinCost").val() : "0",
        maxPrice: $("#filterMaxCost").val() ? $("#filterMaxCost").val() : Number.MAX_VALUE + "",
        name: $("#filterTitle").val() ? $("#filterTitle").val() : "",
        gender: $("#filterGender").val() ? $("#filterGender").val() : "",
    }
    console.log(formData)
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: 'http://localhost:8189/api/v1/products/get',
        data: JSON.stringify(formData),
        dataType: 'json',
        success: function (result) {
            currentPage = pageIndex
            productList = result;
            console.log(result)

            $('#example').empty();
            $('#currentPage').empty();
            let rd = $('<div ></div>');
            if (productList.length > 0) {
                for (let k = 0; k < productList.length; k++) {
                    rd.append('<div  class = "block" >' +
                        "<p class=\"page-information\"><img id=\"photoId" + productList[k].productId + "\" src=\"/images/" + productList[k].fotoId + "\" + width=\"130\" height=\"130\"></p>" +
                        "<p class=\"page-information\"> Name: " + productList[k].productTitle + "</p>" +
                        "<p class=\"page-information\"> Gender: " + productList[k].parameters.productGender + "</p>" +
                        "<p class=\"page-information\"> Age:  " + productList[k].parameters.productAge + "</p>" +
                        "<p class=\"page-information\"> Lifespan:  " + productList[k].parameters.productLifespan + "</p>" +
                        "<p class=\"page-information\"> Price:  " + productList[k].productPrice + "</p>" +
                        "<p class=\"page-information\" id=\"quantity" + productList[k].productId + "\"> Quantity:  " + productList[k].productQuantity + "</p>" +
                        "<input class=\"btn btn-primary\" type='button' onclick= \"changeProduct(" + productList[k].productId + ")\"  value='Change product'/>" +
                        "<input class=\"btn btn-danger\" type='button' id=\'buttonDelete" + productList[k].productId + "\' onclick= \"deleteProduct(" + productList[k].productId + ")\"  value='Delete product'/>" +
                        "</div>");
                    $('#example').append(rd);
                    if (productList[k].productQuantity === 0) {
                        $("#buttonDelete" + productList[k].productId).hide();
                        $("#quantity" + productList[k].productId).css("color", "red");
                    }
                }
            }
        }, complete: function () {
            getProductCount(formData)
        }
    });
}


changeProduct = function (id) {
    $.ajax({
        type: "GET",
        url: 'http://localhost:8189/addproducts',
        headers: {
            "Authorization": "Bearer " + localStorage.token
        }, success: function (response) {
            localStorage.productId = id;
            location.assign("http://localhost:8189/addproducts")
        }
    })
}

$(document).ready(function () {
    delete localStorage.productId;
    getProducts()

    $("#filterButton").click(function (event) {
        localStorage.setItem("pageIndx", 1);
        event.preventDefault();
        getProducts()
    });

    $("#addButton").click(function (event) {
        addToCart(1)
    });
});

