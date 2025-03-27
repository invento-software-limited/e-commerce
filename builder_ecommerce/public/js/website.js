document.addEventListener("DOMContentLoaded", function () {
  const CSRF_TOKEN = frappe.csrf_token
  const HEADERS = {
    "Content-Type": "application/json",
    "x-frappe-csrf-token": CSRF_TOKEN,
    "x-requested-with": "XMLHttpRequest",
    Accept: "application/json, text/javascript, */*; q=0.01"
  }

  get_cart_count()
  if (window.location.pathname === "/cart" || window.location.pathname === "/checkout") {
    const placeOrderBtn = document.getElementById("place-order")
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("submit", async function (event) {
        event.preventDefault();

        let formData = new FormData(this);
        let jsonData = {};

        formData.forEach((value, key) => {
          jsonData[key] = value;
        });
        let payload = {doc: jsonData, cart_items: frappe.get_cookie("cart_items")};
        let response = await fetch("/api/method/builder_ecommerce.cart.place_order", {
          method: "POST", headers: HEADERS, body: JSON.stringify(payload)
        });

        let result = await response.json();
        if (result.message) {
          alert("Address added successfully!");
          location.reload();
        } else {
          let message_obj = JSON.parse(result._server_messages)
          let message = JSON.parse(message_obj)
          Toastify({
            text: `${message.message}`,
            close: true,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
        }
      });
    }
    get_cart_items();
  }

  const searchInput = document.getElementById("search-input");
  const productSearch = document.getElementById("product_search");
  if (productSearch) {
    productSearch.style.display = "none";
  }

  function positionProductSearch() {
    const rect = searchInput.getBoundingClientRect();
    productSearch.style.position = "absolute";
    productSearch.style.top = `${rect.bottom + window.scrollY}px`;
    productSearch.style.left = `${rect.left + window.scrollX}px`;
    productSearch.style.width = `${rect.width}px`;
    productSearch.style.zIndex = "1000";
    productSearch.style.display = "block";
  }

  if (productSearch) {

    let originalContent = productSearch.innerHTML;
    productSearch.innerHTML = "";

    searchInput.addEventListener("input", function () {
      let searchTerm = searchInput.value.toLowerCase();
      positionProductSearch()
      // If search is empty, clear the container
      if (searchTerm.trim() === "") {
        productSearch.innerHTML = "";
        productSearch.style.display = "none";
        return;
      }

      productSearch.innerHTML = ""; // Clear previous results

      let filteredProducts = page_data.products.filter(product => product.item_name.toLowerCase().includes(searchTerm));

      filteredProducts.forEach(product => {
        let tempContainer = document.createElement("div");
        tempContainer.innerHTML = originalContent;

        // Update product name
        let nameElement = tempContainer.querySelector(".product_name p");
        if (nameElement) {
          nameElement.textContent = product.item_name;
        }
        let imageElement = tempContainer.querySelector(".product_image");
        if (imageElement) {
          imageElement.setAttribute('src', product.image);
        }
        let priceElement = tempContainer.querySelector(".product_price p");
        if (priceElement) {
          priceElement.textContent = `Price : ${product.standard_rate}`;
        }
        productSearch.appendChild(tempContainer);
      });
    });
  }

  function showVariantSelectionModal(attributes, itemCode) {
    let modalBody = document.getElementById("variantModalBody");
    modalBody.innerHTML = "";

    attributes.forEach(attr => {
      let selectDiv = document.createElement("div");
      selectDiv.classList.add("select-container");

      let label = document.createElement("label");
      label.textContent = attr.attribute;

      let select = document.createElement("select");
      select.setAttribute("name", attr.attribute);

      attr.values.forEach(value => {
        let option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });

      selectDiv.appendChild(label);
      selectDiv.appendChild(select);
      modalBody.appendChild(selectDiv);
    });

    let modal = document.getElementById("variantModal");
    modal.style.display = "block";

    document.getElementById("closeModal").onclick = function () {
      modal.style.display = "none";
    }

    document.getElementById("confirmVariantSelection").onclick = function () {
      let selectedAttributes = {};
      document.querySelectorAll("#variantModalBody select").forEach(select => {
        selectedAttributes[select.name] = select.value;
      });
      fetch('/api/method/builder_ecommerce.ecommerce.variant_selector.utils.get_next_attribute_and_values', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({item_code: itemCode, selected_attributes: selectedAttributes}),
      }).then(response => response.json())
        .then(data => {
          addToCart(data.message, 1)
        })
      modal.style.display = "none";
    };
  }

  function addToCart(itemCode, qty) {
    fetch("/api/method/builder_ecommerce.cart.update_cart", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({item_code: itemCode, qty: qty, cart_items: frappe.get_cookie("cart_items")}),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw {status: response.status, message: errData.message || "Something went wrong"};
          });
        }
        return response.json();
      })
      .then(data => {
        get_cart_count()
        Toastify({
          text: "Item added to cart!",
          close: true,
          destination: "/cart",
          gravity: "top",
          position: "center",
          stopOnFocus: true,
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          }
        }).showToast();
      })
  }

  document.querySelectorAll(".btn-order-cancel").forEach(button => {
    button.addEventListener("click", function () {
      let name = this.getAttribute("data-name");
      if (!name) return;
      fetch('/api/method/builder_ecommerce.ecommerce.order.order.cancel_order', {
        method: "POST", headers: HEADERS, body: JSON.stringify({order_id: name})
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.message.message);
          } else {
            alert("No message returned from the server.");
          }
        })
        .catch(error => console.error("Error fetching attributes:", error));

    });
  });

  const dropdownButtons = document.querySelectorAll(".dropdown-btn");

  dropdownButtons.forEach((btn) => {
    const dropdownList = btn.nextElementSibling; // Get the corresponding dropdown list

    btn.addEventListener("mouseover", function () {
      positionDropdown(this, dropdownList);
    });

    btn.addEventListener("mouseleave", function (event) {
      // Check if mouse moves into the dropdown list
      if (!dropdownList.contains(event.relatedTarget)) {
        dropdownList.style.display = "none";
      }
    });

    dropdownList.addEventListener("mouseleave", function () {
      dropdownList.style.display = "none";
    });

    dropdownList.addEventListener("mouseover", function () {
      dropdownList.style.display = "flex";
    });
  });

  function positionDropdown(button, dropdown) {
    const rect = button.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.width = "auto";
    dropdown.style.zIndex = "1000";
    dropdown.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
    dropdown.style.borderRadius = "0px";
    dropdown.style.padding = "20px";
    dropdown.style.display = "flex";
    dropdown.style.flexDirection = "column";
  }

  document.querySelectorAll(".btn-reorder").forEach(button => {
    button.addEventListener("click", function () {
      let name = this.getAttribute("data-name");
      if (!name) return;
      fetch('/api/method/builder_ecommerce.ecommerce.order.order.reorder', {
        method: "POST", headers: HEADERS, body: JSON.stringify({order_id: name})
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            Toastify({
              text: data.message.message, close: true, gravity: "top", position: "center", stopOnFocus: true, style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
              }
            }).showToast();
          } else {
            alert("No message returned from the server.");
          }
        })
        .catch(error => console.error("Error fetching attributes:", error));

    });
  });
  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", function () {
      let itemCode = this.getAttribute("data-item_code");
      if (!itemCode) return;

      // Find the product in page_data.products
      let product = page_data.products.find(product => product.item_code === itemCode);

      if (product) {
        if (product.has_variants === 1) {
          // Fetch attributes from API
          fetch(`/api/method/builder_ecommerce.ecommerce.variant_selector.utils.get_attributes_and_values?item_code=${itemCode}`, {
            method: "GET", headers: HEADERS,
          })
            .then(response => response.json())
            .then(data => {
              if (data.message && data.message.length > 0) {
                showVariantSelectionModal(data.message, itemCode);
              }
            })
            .catch(error => console.error("Error fetching attributes:", error));
        } else {
          addToCart(itemCode, 1)
        }
      } else {
        console.log("Product not found.");
      }

    });
  });

  function get_cart_count() {
    const cartCount = frappe.get_cookie("cart_count") || 0;
    const cartTotal = frappe.get_cookie("cart_total") || 0;
    const cartCountContainer = document.getElementById("cart_count");
    const cartTotalContainer = document.getElementById("cart_total");
    if (cartCountContainer) {
      cartCountContainer.innerText = cartCount;
    }
    if (cartTotalContainer) {
      cartTotalContainer.innerText = cartTotal;
    }
  }


  function get_cart_items() {
    const cartItems = frappe.get_cookie("cart_items") || "[]";

    fetch(`/api/method/builder_ecommerce.cart.get_cart_items?cart_items=${cartItems}`, {
      method: "GET", headers: HEADERS
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw {status: response.status, message: errData.message || "Something went wrong"};
          });
        }
        return response.json();
      })
      .then(data => {
        const [cartItems, orderDetails] = data.message;
        let cartContainer = document.querySelector('#cart-container');
        let originalContent = cartContainer.innerHTML;
        cartContainer.innerHTML = '';  // Clear original content

        if (cartItems.length === 0) {
          let placeOrderElement = document.getElementById("place-order");
          let cartElement = document.getElementById("cart-section");
          let emptyElement = document.getElementById("empty-cart");
          if (cartElement && emptyElement) {
            cartElement.style.display = "none";
            emptyElement.style.display = 'flex';
          }

          if (placeOrderElement) {
            placeOrderElement.style.display = 'none';
          }
        } else {
          // Process and display cart items
          cartItems.forEach(item => {
            let tempContainer = document.createElement('div');
            tempContainer.innerHTML = originalContent;

            // Update the content
            let nameElement = tempContainer.querySelector('.item_name p');
            if (nameElement) {
              nameElement.textContent = item.item_name;
            }
            let qtyElement = tempContainer.querySelector('.item_qty p');
            if (qtyElement) {
              qtyElement.textContent = item.qty;
            }
            let imageElement = tempContainer.querySelector('.item_image');
            if (imageElement) {
              imageElement.setAttribute('src', item.image);
            }
            let codeElement = tempContainer.querySelector('.item_code p');
            if (codeElement) {
              codeElement.textContent = item.item_code;
            }
            let priceElement = tempContainer.querySelector('.price p');
            if (priceElement) {
              priceElement.textContent = item.amount;
            }

            let rateElement = tempContainer.querySelector('.rate p');
            if (rateElement) {
              rateElement.textContent = item.rate;
            }

            // Update data attributes for update cart button
            let updateElements = tempContainer.querySelectorAll('.update_cart_qty');
            updateElements.forEach(updateElement => {
              updateElement.dataset.itemCode = item.item_code;
              updateElement.onclick = function () {
                let itemCode = this.dataset.itemCode;
                let action = this.dataset.action;
                let qty = parseInt(this.dataset.qty) || 1;

                update_cart_qty(itemCode, qty, action);
                get_cart_count()
              };
            });

            cartContainer.appendChild(tempContainer);
          });
        }
        if (orderDetails) {
          let subTotalItem = document.getElementById('sub_total');
          if (subTotalItem) {
            subTotalItem.innerHTML = orderDetails.total_price;
          }
          let grandTotalItem = document.getElementById('grand_total');
          if (grandTotalItem) {
            grandTotalItem.innerHTML = orderDetails.grand_total;
          }
          const taxContainerParent = document.getElementById('tax_container')
          if (taxContainerParent) {
            const taxOriginalContent = taxContainerParent.innerHTML
            taxContainerParent.innerHTML = ''
            orderDetails.order_summary.forEach(summary => {

              let tempTaxContainer = document.createElement('div');
              tempTaxContainer.innerHTML = taxOriginalContent;

              let nameElement = tempTaxContainer.querySelector('.tax_name p');
              if (nameElement) {
                let description = ''
                if (summary.included_in_price === 1) {
                  description = `${summary.description}(Inc)`
                } else {
                  description = summary.description
                }
                nameElement.innerHTML = description
              }


              let amountElement = tempTaxContainer.querySelector('.tax_amount p');
              if (amountElement) {
                amountElement.innerHTML = summary.tax_amount
              }

              taxContainerParent.appendChild(tempTaxContainer);
            })
          }
        }
      })
      .catch(error => {
        alert("Error adding item: " + (error.message || "Unknown error"));
      });
  }


  function update_cart_qty(item_code, qty, action) {
    fetch('/api/method/builder_ecommerce.cart.update_cart_qty', {
      method: "POST", headers: HEADERS, body: JSON.stringify({
        item_code: item_code, qty: qty, action: action, cart_items: frappe.get_cookie("cart_items") || "[]"
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw {status: response.status, message: errData.message || "Something went wrong"};
          });
        }
        return response.json();
      })
      .then(data => {
        window.location.reload();
      })
      .catch(error => {
        alert("Error adding item: " + (error.message || "Unknown error"));  // Error message
      });
  }

  document.getElementById("newsletter_subscribe").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this);
    const formObject = Object.fromEntries(formData.entries()); // Convert FormData to a plain object

    try {
      const response = await fetch("/api/method/frappe.email.doctype.newsletter.newsletter.subscribe", {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(formObject)
      });

      const data = await response.json();

      if (data.message) {
        Toastify({
          text: "Subscribed successfully!",
          close: true,
          gravity: "top",
          position: "center",
          stopOnFocus: true,
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          }
        }).showToast();
      } else {
        throw new Error(data.exc || "Subscription failed! Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);

      let errorMessage = "An error occurred. Please try again.";

      // Try to extract error message from the response
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData._server_messages) {
            const serverMessages = JSON.parse(errorData._server_messages);
            errorMessage = serverMessages.map(msg => JSON.parse(msg).message).join(" ");
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }
      }

      Toastify({
        text: errorMessage,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #ff416c, #ff4b2b)",
        }
      }).showToast();
    }
  });

  document.querySelectorAll('.collapse-btn').forEach(button => {
    button.addEventListener('click', function () {
      const categoryId = this.getAttribute('data-category_id');
      const targetDiv = document.getElementById(categoryId);
      const extendButton = this.parentElement.querySelector('.extend-btn'); // Find extend-btn within the same parent

      if (targetDiv) {
        targetDiv.style.display = 'none';

        if (extendButton) {
          extendButton.style.display = 'flex';
          this.style.display = 'none'
        }
      }
    });
  });
  document.querySelectorAll('.extend-btn').forEach(button => {
    button.addEventListener('click', function () {
      const categoryId = this.getAttribute('data-category_id');
      const targetDiv = document.getElementById(categoryId);
      const collapseButton = this.parentElement.querySelector('.collapse-btn');

      if (targetDiv) {
        targetDiv.style.display = 'flex';
        if (collapseButton) {
          collapseButton.style.display = 'flex';
          this.style.display = 'none';
        }
      }
    });
  });

});


frappe.get_cookie = function getCookie(name) {
  return frappe.get_cookies()[name];
};

frappe.get_cookies = function getCookies() {
  var c = document.cookie, v = 0, cookies = {};
  if (document.cookie.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
    c = RegExp.$1;
    v = 1;
  }
  if (v === 0) {
    c.split(/[,;]/).map(function (cookie) {
      var parts = cookie.split(/=/, 2), name = decodeURIComponent(parts[0].trimLeft()),
        value = parts.length > 1 ? decodeURIComponent(parts[1].trimRight()) : null;
      if (value && value.charAt(0) === '"') {
        value = value.substr(1, value.length - 2);
      }
      cookies[name] = value;
    });
  } else {
    c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function ($0, $1) {
      var name = $0, value = $1.charAt(0) === '"' ? $1.substr(1, -1).replace(/\\(.)/g, "$1") : $1;
      cookies[name] = value;
    });
  }
  return cookies;
};
