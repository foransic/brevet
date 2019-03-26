document.addEventListener("DOMContentLoaded", function(el) {
    document.getElementById('citySelect').addEventListener('change', function(e) {
        submitFilterForm('city', this.options[this.selectedIndex].value);
    });

    document.getElementById('deptSelect').addEventListener('change', function(e) {
        submitFilterForm('dept', this.options[this.selectedIndex].value);
    });

    document.getElementById('typeSelect').addEventListener('change', function(e) {
        submitFilterForm('type', this.options[this.selectedIndex].value);
    });

    submitFilterForm = function(filterField, filterValue) {
        sortOrder = document.getElementById('sortOrder').value;
        sortField = document.getElementById('sortField').value;

        if (filterValue) {
            window.location.href = sortField + '-' + sortOrder + '-' + filterField + '-' + filterValue;
        } else {
            window.location.href = sortField + '-' + sortOrder + '--';
        }
        
    }
});