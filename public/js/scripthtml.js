document.addEventListener('DOMContentLoaded', function () {
    /* -----------------
    paginacion
    ----------------- */
    const categoryItems = document.querySelectorAll('.category-item');
    const paginationLinks = document.querySelectorAll('.pagination-link');
    const itemsPerPage = 3;

    function showPage(pageNumber) {
        categoryItems.forEach((item, index) => {
            const startIndex = (pageNumber - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            if (index >= startIndex && index < endIndex) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });

        paginationLinks.forEach((link) => {
            link.classList.remove('active');
            link.classList.remove('btn-secondary');
            link.classList.add('btn-light');
            if (parseInt(link.dataset.page) === pageNumber) {
                link.classList.add('active');
                link.classList.remove('btn-light');
                link.classList.add('btn-secondary');
            }
        });
    }

    if (categoryItems.length > 0 && paginationLinks.length > 0) {
        paginationLinks.forEach((link) => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const pageNumber = parseInt(this.dataset.page);
                showPage(pageNumber);
            });
        });

        showPage(1);
    }


});
