(function() {
  'use strict';

  angular.module('ui.tree')

    .controller('TreeNodeController', ['$scope', '$element', '$attrs', 'treeConfig',
      function ($scope, $element, $attrs, treeConfig) {
        this.scope = $scope;

        $scope.$element = $element; // xgao: no use.
        $scope.$nodeElement = $element; // xgao: no use.
        $scope.$modelValue = undefined; // Model value for node;
        $scope.$parentNodeScope = undefined; // uiTreeNode Scope of parent node;
        $scope.$childNodesScope = undefined; // uiTreeNodes Scope of child nodes.
        $scope.$parentNodesScope = undefined; // uiTreeNodes Scope of parent nodes.
        $scope.$treeScope = undefined; // uiTree scope
        $scope.$handleScope = undefined; // it's handle scope
        $scope.$type = 'uiTreeNode';
        $scope.$$apply = false; // xgao: represent if it in a $apply function
        $scope.$dragInfo = undefined; // xgao: store info needed by drag. refer to helper.js dragInfo()

        $scope.collapsed = false;
        $scope.expandOnHover = false;

        $scope.selected = false;

        $scope.init = function(controllersArr) {
          var treeNodesCtrl = controllersArr[0];
          $scope.$treeScope = controllersArr[1] ? controllersArr[1].scope : undefined;

          // find the scope of it's parent node
          $scope.$parentNodeScope = treeNodesCtrl.scope.$nodeScope;
          // modelValue for current node
          $scope.$modelValue = treeNodesCtrl.scope.$modelValue[$scope.$index];
          $scope.$parentNodesScope = treeNodesCtrl.scope;
          console.log($scope)
          treeNodesCtrl.scope.initSubNode($scope); // init sub nodes

          $element.on('$destroy', function() {
            treeNodesCtrl.scope.destroySubNode($scope); // destroy sub nodes
          });
        };

        $scope.toggleSelected = function() {
          $scope.$childNodesScope.selected = !$scope.selected;
          $scope.selectSubNode(!$scope.selected);
          if ($scope.selected) {
            $scope.unselect();
          } else {
            $scope.select();
          }
        };

        $scope.select = function() {
          if (!$scope.selected && $scope.$treeScope.$callbacks.select($scope)) {
            $scope.selected = true;
            $scope.$treeScope.$selecteds.push($scope.$element);
          }
        };

        $scope.unselect = function() {
          console.log($scope.$parentNodeScope)
          if (!$scope.$parentNodesScope.selected && $scope.selected && $scope.$treeScope.$callbacks.unselect($scope)) {
            $scope.selected = false;

            var indexOf = $scope.$treeScope.$selecteds.indexOf($scope.$element);
            if (angular.isDefined(indexOf) && indexOf > -1) {
              $scope.$treeScope.$selecteds.splice(indexOf, 1);
            }
          }
        };

        $scope.selectSubNode = function(select) {
          var childNodes = $scope.childNodes();
          for (var i = childNodes.length - 1; i >= 0; i--) {
            if (select) {
              childNodes[i].select();
            } else {
              childNodes[i].unselect();
            }
            childNodes[i].selectSubNode(select);
          };
        }

        $scope.index = function() {
          return $scope.$parentNodesScope.$modelValue.indexOf($scope.$modelValue);
        };

        $scope.dragEnabled = function() {
          return !($scope.$treeScope && !$scope.$treeScope.dragEnabled);
        };

        $scope.isSibling = function(targetNode) {
          return $scope.$parentNodesScope === targetNode.$parentNodesScope;
        };

        $scope.isChild = function(targetNode) {
          var nodes = $scope.childNodes();
          return nodes && nodes.indexOf(targetNode) > -1;
        };

        $scope.prev = function() {
          var index = $scope.index();
          if (index > 0) {
            return $scope.siblings()[index - 1];
          }

          return undefined;
        };

        $scope.siblings = function() {
          return $scope.$parentNodesScope.childNodes();
        };

        $scope.childNodesCount = function() {
          return (angular.isDefined($scope.childNodes())) ? $scope.childNodes().length : 0;
        };

        $scope.hasChild = function() {
          return $scope.childNodesCount() > 0;
        };

        $scope.childNodes = function() {
          return (angular.isDefined($scope.$childNodesScope) && angular.isDefined($scope.$childNodesScope.$modelValue)) ?
                 $scope.$childNodesScope.childNodes() : undefined;
        };

        $scope.accept = function(sourceNode, destIndex) {
          return angular.isDefined($scope.$childNodesScope) &&
                  angular.isDefined($scope.$childNodesScope.$modelValue) &&
                  $scope.$childNodesScope.accept(sourceNode, destIndex);
        };

        $scope.removeNode = function() {
          if ($scope.$treeScope.$callbacks.remove(node)) {
            var node = $scope.remove();

            return node;
          }

          return undefined;
        };

        $scope.remove = function() {
          return $scope.$parentNodesScope.removeNode($scope);
        };

        $scope.toggle = function() {
          $scope.collapsed = !$scope.collapsed;
        };

        $scope.collapse = function(all) {
          $scope.collapsed = $scope.$treeScope.$callbacks.collapse($scope, all);
        };

        $scope.expand = function(all) {
          $scope.collapsed = !$scope.$treeScope.$callbacks.expand($scope, all);
        };

        $scope.depth = function() {
          var parentNode = $scope.$parentNodeScope;
          if (parentNode) {
            return parentNode.depth() + 1;
          }

          return 1;
        };

        var subDepth = 0;
        var countSubDepth = function(scope) {
          var count = 0;
          var nodes = scope.childNodes();
          for (var i = 0; i < nodes.length; i++) {
            var childNodes = nodes[i].$childNodesScope;
            if (childNodes) {
              count = 1;
              countSubDepth(childNodes);
            }
          }
          subDepth += count;
        };

        $scope.maxSubDepth = function() {
          subDepth = 0;
          if ($scope.$childNodesScope) {
            countSubDepth($scope.$childNodesScope);
          }

          return subDepth;
        };

        $scope.newSubItem = function(scope) {
          var nodeData = scope.$modelValue;
          nodeData.nodes.push({
            id: nodeData.id * 10 + nodeData.nodes.length,
            title: nodeData.title + '.' + (nodeData.nodes.length + 1),
            nodes: []
          });
        };

        $scope.onKeyDown = function(scope, $event) {
          //console.log($event);
          if ($event.shiftKey && 13 == $event.keyCode) {
            scope.newSubItem(scope);
            //$event.cancelBubble = true;
            $event.returnValue = false;
          }
        };

        $scope.onClick = function(scope, $event) {
          //console.log($event);
          if ($event.ctrlKey) {
            scope.toggleSelected();
            $event.returnValue = false;
          }
        };

      }
    ]);
})();
