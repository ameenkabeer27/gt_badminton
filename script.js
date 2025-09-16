document.addEventListener('DOMContentLoaded', () => {
    // Example: Calculate pending matches
    const totalMatches = 20; // Update manually or from data
    const completed = 8;
    const pending = totalMatches - completed;
    document.querySelectorAll('.stat p')[3].textContent = pending;
});
