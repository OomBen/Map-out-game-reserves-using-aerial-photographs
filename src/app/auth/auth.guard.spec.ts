import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: any;
  //const routerMock: any = jasmine.createSpyObj('Router', ['navigate']);
  const authMock: any = jasmine.createSpyObj('AWSAmplifyWrapper', ['getAuth']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AuthGuard]
    }).compileComponents();
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return false for canActivate', (done) => {
    authMock.getAuth.and.returnValue(false);
    const result: Promise<boolean> = guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'dashboard' });
    result.then((resp: boolean) => {
      expect(resp).toBe(false);
      done();
      //expect(routerMock.navigate).toHaveBeenCalled();
    }).catch(() => {
      done.fail('The promise was rejected.');
    });
  });

});
