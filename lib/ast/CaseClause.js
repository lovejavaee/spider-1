"use strict";
(function () {
    var Node = require("./Node").Node;
    function CaseClause(tests, body) {
        Node.call(this);
        this.type = "CaseClause";
        this.body = body;
        this.body.parent = this;
        this.tests = tests;
        if (typeof this.tests !== "undefined" && this.tests !== null) {
            this.tests.forEach(function (test) {
                test.parent = this;
            }, this);
        }
    }
    CaseClause.prototype = Object.create(Node);
    CaseClause.prototype.codegen = function (branchFallthrough) {
        if (!Node.prototype.codegen.call(this)) {
            return;
        }
        if (!(typeof this.tests !== "undefined" && this.tests !== null) && !branchFallthrough) {
            return this.body.codegen();
        }
        this.type = "IfStatement";
        this.switchCase = true;
        var rangeError = false;
        if (typeof this.tests !== "undefined" && this.tests !== null) {
            this.tests.forEach(function (test) {
                var equalsToDiscriminant;
                if (test.type === "Range") {
                    var fromCheck;
                    if (test.from) {
                        fromCheck = {
                            "type": "BinaryExpression",
                            "operator": ">=",
                            "left": this.parent.discriminant,
                            "right": test.from
                        };
                    }
                    var toCheck;
                    if (test.to) {
                        toCheck = {
                            "type": "BinaryExpression",
                            "operator": "<" + (test.operator === ".." ? "=" : ""),
                            "left": this.parent.discriminant,
                            "right": test.to
                        };
                    }
                    if (!!fromCheck && !!toCheck) {
                        equalsToDiscriminant = {
                            "type": "LogicalExpression",
                            "operator": "&&",
                            "left": fromCheck,
                            "right": toCheck
                        };
                    } else {
                        if (!!fromCheck || !!toCheck) {
                            equalsToDiscriminant = typeof fromCheck === "undefined" || fromCheck == null ? toCheck : fromCheck;
                        } else {
                            rangeError = test;
                            return false;
                        }
                    }
                } else {
                    equalsToDiscriminant = {
                        "type": "BinaryExpression",
                        "operator": "===",
                        "left": this.parent.discriminant,
                        "right": test.codegen()
                    };
                }
                if (!this.test) {
                    this.test = equalsToDiscriminant;
                } else {
                    this.test = {
                        "type": "LogicalExpression",
                        "operator": "||",
                        "left": this.test,
                        "right": equalsToDiscriminant
                    };
                }
            }, this);
        }
        if (rangeError) {
            Node.getErrorManager().error({
                type: "EmptyRange",
                message: "empty range in case clause is disallowed.",
                loc: rangeError.loc
            });
            return null;
        }
        this.consequent = this.body.codegen();
        if (branchFallthrough) {
            var fallthroughTest = {
                "type": "BinaryExpression",
                "left": this.parent.fallthroughId,
                "operator": "<",
                "right": {
                    "type": "Literal",
                    "value": 2
                }
            };
            if (!(typeof this.tests !== "undefined" && this.tests !== null)) {
                this.test = fallthroughTest;
            } else {
                this.test = {
                    "type": "LogicalExpression",
                    "operator": "&&",
                    "left": fallthroughTest,
                    "right": this.test
                };
            }
        }
        this.alternate = null;
        return this;
    };
    exports.CaseClause = CaseClause;
}());

//# sourceMappingURL=lib/ast/CaseClause.map