export const SAMPLE_LP = `max: 10x0 + 11x1;
x0 + 2x1 <= 5;
x0 + x1 <= 3;`

export const SAMPLE_MPS = `NAME          TEST
OBJSENSE
  MAX
ROWS
 N  Obj     
 L  r0      
 L  r1      
COLUMNS
    c0        Obj       10
    c0        r0        1
    c0        r1        1
    c1        Obj       11
    c1        r0        2
    c1        r1        1
RHS
    RHS_V     r0        5
    RHS_V     r1        3
BOUNDS
 FR BOUND     c0      
 FR BOUND     c1      
ENDATA`;