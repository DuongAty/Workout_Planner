import { UserProfileDto } from './user.profile.dto';

describe('UserProfileDto', () => {
  it('Therefore, it is possible to create an instance and assign the correct values to the fields.', () => {
    const dto = new UserProfileDto();
    const mockData = {
      fullname: 'Nguyen Van A',
      username: 'nva123',
    };
    dto.fullname = mockData.fullname;
    dto.username = mockData.username;
    expect(dto).toBeDefined();
    expect(dto.fullname).toBe(mockData.fullname);
    expect(dto.username).toBe(mockData.username);
  });
  it('Therefore, the data structure should be empty when first initialized.', () => {
    const dto = new UserProfileDto();
    expect(dto.fullname).toBeUndefined();
    expect(dto.username).toBeUndefined();
  });
});
