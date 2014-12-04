angular.module("vga").directive('vga-buffer', function() {
    return  {
        templateUrl: "partials/vga.html",
        restrict: "E",
        scope: {
            buffer: "="
        },
        controller: function($scope, $element) {

        }
    };
});